/**
 * Fork n Cork - Admin Dashboard JS
 * Full admin panel: dashboard stats, categories, products, orders, messages,
 * settings, and opening hours management.
 */

const ADMIN_API = '/api';

// ---------------------------------------------------------------------------
// Auth check
// ---------------------------------------------------------------------------

const checkAuth = async () => {
  try {
    const res = await fetch(`${ADMIN_API}/auth/profile`, {
      credentials: 'include',
    });

    if (!res.ok) {
      window.location.href = '/admin/login';
      return false;
    }

    const json = await res.json();
    if (!json.success) {
      window.location.href = '/admin/login';
      return false;
    }

    // Show admin name if element exists
    const adminName = document.getElementById('admin-user-name');
    if (adminName && json.data) {
      adminName.textContent = json.data.name || json.data.email || 'Admin';
    }

    return true;
  } catch {
    window.location.href = '/admin/login';
    return false;
  }
};

// ---------------------------------------------------------------------------
// Sidebar navigation
// ---------------------------------------------------------------------------

const initSidebar = () => {
  const navLinks = document.querySelectorAll('.admin-nav-link');
  const sections = document.querySelectorAll('.admin-section');

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const target = link.dataset.section;

      // Update active nav link
      navLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');

      // Show target section, hide others
      sections.forEach((s) => {
        s.classList.toggle('active', s.id === `section-${target}`);
      });

      // Load data for the section
      loadSectionData(target);
    });
  });
};

const loadSectionData = (section) => {
  switch (section) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'categories':
      loadCategories();
      break;
    case 'products':
      loadProducts();
      break;
    case 'orders':
      loadOrders();
      break;
    case 'messages':
      loadMessages();
      break;
    case 'settings':
      loadSettings();
      loadOpeningHours();
      break;
  }
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

const loadDashboard = async () => {
  const container = document.getElementById('dashboard-stats');
  if (!container) return;

  try {
    const res = await fetch(`${ADMIN_API}/admin/dashboard`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load dashboard');
    }

    const stats = json.data;

    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-icon stat-icon-orders">&#128230;</div>
        <div class="stat-card-info">
          <h3>${stats.total_orders ?? 0}</h3>
          <p>Total Orders</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon stat-icon-pending">&#9203;</div>
        <div class="stat-card-info">
          <h3>${stats.pending_orders ?? 0}</h3>
          <p>Pending Orders</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon stat-icon-products">&#127860;</div>
        <div class="stat-card-info">
          <h3>${stats.total_products ?? 0}</h3>
          <p>Products</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon stat-icon-revenue">&#128176;</div>
        <div class="stat-card-info">
          <h3>${formatAdminPrice(stats.total_revenue ?? 0)}</h3>
          <p>Total Revenue</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon stat-icon-categories">&#128203;</div>
        <div class="stat-card-info">
          <h3>${stats.total_categories ?? 0}</h3>
          <p>Categories</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon stat-icon-messages">&#9993;</div>
        <div class="stat-card-info">
          <h3>${stats.unread_messages ?? 0}</h3>
          <p>Unread Messages</p>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Dashboard error:', err);
    container.innerHTML = '<p class="text-error">Failed to load dashboard data.</p>';
  }
};

const formatAdminPrice = (amount) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `\u20AC${num.toFixed(2)}`;
};

// ---------------------------------------------------------------------------
// Categories CRUD
// ---------------------------------------------------------------------------

let editingCategoryId = null;

const loadCategories = async () => {
  const tbody = document.getElementById('categories-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

  try {
    const res = await fetch(`${ADMIN_API}/categories`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load categories');
    }

    const categories = json.data || [];

    if (categories.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">No categories found.</td></tr>';
      return;
    }

    tbody.innerHTML = categories
      .map(
        (cat) => `
      <tr data-id="${cat.id}">
        <td>${cat.id}</td>
        <td>${cat.name}</td>
        <td>${cat.description || '-'}</td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-edit" data-id="${cat.id}" data-name="${escapeAttr(cat.name)}" data-description="${escapeAttr(cat.description || '')}">Edit</button>
          <button class="btn btn-sm btn-danger btn-delete-category" data-id="${cat.id}" data-name="${escapeAttr(cat.name)}">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');

    // Edit handlers
    tbody.querySelectorAll('.btn-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        editingCategoryId = parseInt(btn.dataset.id, 10);
        const nameInput = document.getElementById('category-name');
        const descInput = document.getElementById('category-description');
        const submitBtn = document.getElementById('category-form-submit');

        if (nameInput) nameInput.value = btn.dataset.name;
        if (descInput) descInput.value = btn.dataset.description;
        if (submitBtn) submitBtn.textContent = 'Update Category';

        const cancelBtn = document.getElementById('category-edit-cancel');
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
      });
    });

    // Delete handlers
    tbody.querySelectorAll('.btn-delete-category').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const name = btn.dataset.name;
        if (confirm(`Are you sure you want to delete the category "${name}"?`)) {
          deleteCategory(id);
        }
      });
    });
  } catch (err) {
    console.error('Categories error:', err);
    tbody.innerHTML = '<tr><td colspan="4">Failed to load categories.</td></tr>';
  }
};

const initCategoryForm = () => {
  const form = document.getElementById('category-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('category-name')?.value.trim();
    const description = document.getElementById('category-description')?.value.trim();

    if (!name) {
      showToast('Category name is required', 'error');
      return;
    }

    const submitBtn = document.getElementById('category-form-submit');
    submitBtn.disabled = true;

    try {
      const isEditing = editingCategoryId !== null;
      const url = isEditing
        ? `${ADMIN_API}/categories/${editingCategoryId}`
        : `${ADMIN_API}/categories`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to save category');
      }

      showToast(
        isEditing ? 'Category updated successfully' : 'Category created successfully',
        'success'
      );
      resetCategoryForm();
      loadCategories();
    } catch (err) {
      console.error('Category save error:', err);
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Cancel edit
  const cancelBtn = document.getElementById('category-edit-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => resetCategoryForm());
  }
};

const resetCategoryForm = () => {
  editingCategoryId = null;
  const form = document.getElementById('category-form');
  if (form) form.reset();
  const submitBtn = document.getElementById('category-form-submit');
  if (submitBtn) submitBtn.textContent = 'Add Category';
  const cancelBtn = document.getElementById('category-edit-cancel');
  if (cancelBtn) cancelBtn.style.display = 'none';
};

const deleteCategory = async (id) => {
  try {
    const res = await fetch(`${ADMIN_API}/categories/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to delete category');
    }

    showToast('Category deleted', 'success');
    loadCategories();
  } catch (err) {
    console.error('Delete category error:', err);
    showToast(err.message, 'error');
  }
};

// ---------------------------------------------------------------------------
// Products CRUD
// ---------------------------------------------------------------------------

let editingProductId = null;

const loadProducts = async () => {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';

  try {
    const res = await fetch(`${ADMIN_API}/products`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load products');
    }

    const products = json.data || [];

    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No products found.</td></tr>';
      return;
    }

    tbody.innerHTML = products
      .map(
        (p) => `
      <tr data-id="${p.id}">
        <td>${p.id}</td>
        <td class="product-thumb-cell">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" class="table-thumb">` : '-'}
        </td>
        <td>${p.name}</td>
        <td>${p.category_name || '-'}</td>
        <td>${formatAdminPrice(p.price)}</td>
        <td>
          <span class="badge ${p.is_available !== false ? 'badge-success' : 'badge-danger'}">
            ${p.is_available !== false ? 'Available' : 'Unavailable'}
          </span>
        </td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-edit btn-edit-product" data-id="${p.id}">Edit</button>
          <button class="btn btn-sm btn-danger btn-delete-product" data-id="${p.id}" data-name="${escapeAttr(p.name)}">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');

    // Edit handlers
    tbody.querySelectorAll('.btn-edit-product').forEach((btn) => {
      btn.addEventListener('click', () => editProduct(parseInt(btn.dataset.id, 10)));
    });

    // Delete handlers
    tbody.querySelectorAll('.btn-delete-product').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const name = btn.dataset.name;
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
          deleteProduct(id);
        }
      });
    });
  } catch (err) {
    console.error('Products error:', err);
    tbody.innerHTML = '<tr><td colspan="7">Failed to load products.</td></tr>';
  }
};

const editProduct = async (productId) => {
  try {
    const res = await fetch(`${ADMIN_API}/products/${productId}`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load product');
    }

    const product = json.data;
    editingProductId = product.id;

    const form = document.getElementById('product-form');
    if (!form) return;

    form.querySelector('#product-name').value = product.name || '';
    form.querySelector('#product-description').value = product.description || '';
    form.querySelector('#product-price').value = product.price || '';

    const categorySelect = form.querySelector('#product-category');
    if (categorySelect && product.category_id) {
      categorySelect.value = product.category_id;
    }

    const featuredCheck = form.querySelector('#product-featured');
    if (featuredCheck) featuredCheck.checked = !!product.is_featured;

    const availableCheck = form.querySelector('#product-available');
    if (availableCheck) availableCheck.checked = product.is_available !== false;

    const submitBtn = document.getElementById('product-form-submit');
    if (submitBtn) submitBtn.textContent = 'Update Product';

    const cancelBtn = document.getElementById('product-edit-cancel');
    if (cancelBtn) cancelBtn.style.display = 'inline-block';

    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error('Edit product error:', err);
    showToast(err.message, 'error');
  }
};

const initProductForm = () => {
  const form = document.getElementById('product-form');
  if (!form) return;

  // Load categories for the dropdown
  loadProductCategories();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', form.querySelector('#product-name')?.value.trim() || '');
    formData.append('description', form.querySelector('#product-description')?.value.trim() || '');
    formData.append('price', form.querySelector('#product-price')?.value || '');
    formData.append('category_id', form.querySelector('#product-category')?.value || '');
    formData.append('is_featured', form.querySelector('#product-featured')?.checked ? '1' : '0');
    formData.append('is_available', form.querySelector('#product-available')?.checked ? '1' : '0');

    const imageInput = form.querySelector('#product-image');
    if (imageInput && imageInput.files.length > 0) {
      formData.append('image', imageInput.files[0]);
    }

    const name = formData.get('name');
    const price = formData.get('price');

    if (!name) {
      showToast('Product name is required', 'error');
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      showToast('A valid price is required', 'error');
      return;
    }

    const submitBtn = document.getElementById('product-form-submit');
    submitBtn.disabled = true;

    try {
      const isEditing = editingProductId !== null;
      const url = isEditing
        ? `${ADMIN_API}/products/${editingProductId}`
        : `${ADMIN_API}/products`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        body: formData, // No Content-Type header -- browser sets multipart boundary
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to save product');
      }

      showToast(
        isEditing ? 'Product updated successfully' : 'Product created successfully',
        'success'
      );
      resetProductForm();
      loadProducts();
    } catch (err) {
      console.error('Product save error:', err);
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Cancel edit
  const cancelBtn = document.getElementById('product-edit-cancel');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => resetProductForm());
  }
};

const loadProductCategories = async () => {
  const select = document.getElementById('product-category');
  if (!select) return;

  try {
    const res = await fetch(`${ADMIN_API}/categories`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (res.ok && json.success) {
      const categories = json.data || [];
      select.innerHTML =
        '<option value="">Select Category</option>' +
        categories
          .map((c) => `<option value="${c.id}">${c.name}</option>`)
          .join('');
    }
  } catch (err) {
    console.error('Failed to load product categories:', err);
  }
};

const resetProductForm = () => {
  editingProductId = null;
  const form = document.getElementById('product-form');
  if (form) form.reset();
  const submitBtn = document.getElementById('product-form-submit');
  if (submitBtn) submitBtn.textContent = 'Add Product';
  const cancelBtn = document.getElementById('product-edit-cancel');
  if (cancelBtn) cancelBtn.style.display = 'none';
};

const deleteProduct = async (id) => {
  try {
    const res = await fetch(`${ADMIN_API}/products/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to delete product');
    }

    showToast('Product deleted', 'success');
    loadProducts();
  } catch (err) {
    console.error('Delete product error:', err);
    showToast(err.message, 'error');
  }
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const ORDER_STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'primary',
  ready: 'success',
  completed: 'dark',
  cancelled: 'danger',
};

const loadOrders = async () => {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';

  try {
    const res = await fetch(`${ADMIN_API}/orders`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load orders');
    }

    const orders = json.data || [];

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8">No orders found.</td></tr>';
      return;
    }

    tbody.innerHTML = orders
      .map(
        (order) => `
      <tr data-id="${order.id}">
        <td>${order.order_number || order.id}</td>
        <td>${order.customer_name || '-'}</td>
        <td>${order.customer_email || '-'}</td>
        <td>${order.order_type || '-'}</td>
        <td>${formatAdminPrice(order.total_amount || order.total || 0)}</td>
        <td>
          <span class="badge badge-${ORDER_STATUS_COLORS[order.status] || 'secondary'}">
            ${order.status || 'unknown'}
          </span>
        </td>
        <td>${formatDate(order.created_at)}</td>
        <td class="actions-cell">
          <select class="status-select" data-id="${order.id}">
            <option value="">Update Status</option>
            ${['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
              .map(
                (s) =>
                  `<option value="${s}" ${order.status === s ? 'selected' : ''}>${capitalise(s)}</option>`
              )
              .join('')}
          </select>
          <button class="btn btn-sm btn-view-order" data-id="${order.id}">View</button>
        </td>
      </tr>
      <tr class="order-details-row" id="order-details-${order.id}" style="display:none;">
        <td colspan="8">
          <div class="order-details-content" id="order-details-content-${order.id}">
            Loading...
          </div>
        </td>
      </tr>
    `
      )
      .join('');

    // Status update handlers
    tbody.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', async () => {
        const orderId = parseInt(select.dataset.id, 10);
        const status = select.value;
        if (!status) return;
        await updateOrderStatus(orderId, status);
      });
    });

    // View order details handlers
    tbody.querySelectorAll('.btn-view-order').forEach((btn) => {
      btn.addEventListener('click', () => {
        const orderId = parseInt(btn.dataset.id, 10);
        toggleOrderDetails(orderId);
      });
    });
  } catch (err) {
    console.error('Orders error:', err);
    tbody.innerHTML = '<tr><td colspan="8">Failed to load orders.</td></tr>';
  }
};

const updateOrderStatus = async (orderId, status) => {
  try {
    const res = await fetch(`${ADMIN_API}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to update order status');
    }

    showToast(`Order status updated to ${status}`, 'success');
    loadOrders();
  } catch (err) {
    console.error('Update order status error:', err);
    showToast(err.message, 'error');
  }
};

const toggleOrderDetails = async (orderId) => {
  const row = document.getElementById(`order-details-${orderId}`);
  const content = document.getElementById(`order-details-content-${orderId}`);

  if (!row) return;

  const isVisible = row.style.display !== 'none';

  if (isVisible) {
    row.style.display = 'none';
    return;
  }

  row.style.display = 'table-row';
  content.innerHTML = 'Loading order details...';

  try {
    const res = await fetch(`${ADMIN_API}/orders/${orderId}`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load order details');
    }

    const order = json.data;
    const items = order.items || [];

    content.innerHTML = `
      <div class="order-detail-grid">
        <div class="order-detail-info">
          <h4>Customer Info</h4>
          <p><strong>Name:</strong> ${order.customer_name || '-'}</p>
          <p><strong>Email:</strong> ${order.customer_email || '-'}</p>
          <p><strong>Phone:</strong> ${order.customer_phone || '-'}</p>
          <p><strong>Address:</strong> ${order.customer_address || '-'}</p>
          <p><strong>Type:</strong> ${order.order_type || '-'}</p>
          ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
        </div>
        <div class="order-detail-items">
          <h4>Order Items</h4>
          ${
            items.length > 0
              ? `
            <table class="table table-sm">
              <thead>
                <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.product_name || item.name || `Product #${item.product_id}`}</td>
                    <td>${item.quantity}</td>
                    <td>${formatAdminPrice(item.unit_price || item.price || 0)}</td>
                    <td>${formatAdminPrice((item.unit_price || item.price || 0) * item.quantity)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
              : '<p>No items found.</p>'
          }
          <p class="order-total"><strong>Total: ${formatAdminPrice(order.total_amount || order.total || 0)}</strong></p>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Order details error:', err);
    content.innerHTML = '<p class="text-error">Failed to load order details.</p>';
  }
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

const loadMessages = async () => {
  const tbody = document.getElementById('messages-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

  try {
    const res = await fetch(`${ADMIN_API}/contact`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load messages');
    }

    const messages = json.data || [];

    if (messages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No messages found.</td></tr>';
      return;
    }

    tbody.innerHTML = messages
      .map(
        (msg) => `
      <tr data-id="${msg.id}" class="${msg.is_read ? '' : 'unread-row'}">
        <td>${msg.id}</td>
        <td>${msg.name || '-'}</td>
        <td>${msg.email || '-'}</td>
        <td>${msg.subject || '-'}</td>
        <td>${formatDate(msg.created_at)}</td>
        <td class="actions-cell">
          <button class="btn btn-sm btn-view-message" data-id="${msg.id}">View</button>
          ${!msg.is_read ? `<button class="btn btn-sm btn-mark-read" data-id="${msg.id}">Mark Read</button>` : ''}
          <button class="btn btn-sm btn-danger btn-delete-message" data-id="${msg.id}">Delete</button>
        </td>
      </tr>
      <tr class="message-details-row" id="message-details-${msg.id}" style="display:none;">
        <td colspan="6">
          <div class="message-content-box">
            <p><strong>From:</strong> ${msg.name} (${msg.email})</p>
            ${msg.phone ? `<p><strong>Phone:</strong> ${msg.phone}</p>` : ''}
            <p><strong>Subject:</strong> ${msg.subject || 'No subject'}</p>
            <hr>
            <p>${(msg.message || '').replace(/\n/g, '<br>')}</p>
          </div>
        </td>
      </tr>
    `
      )
      .join('');

    // View message handlers
    tbody.querySelectorAll('.btn-view-message').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        const row = document.getElementById(`message-details-${id}`);
        if (row) {
          row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
        }
      });
    });

    // Mark as read handlers
    tbody.querySelectorAll('.btn-mark-read').forEach((btn) => {
      btn.addEventListener('click', () => markMessageRead(parseInt(btn.dataset.id, 10)));
    });

    // Delete handlers
    tbody.querySelectorAll('.btn-delete-message').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        if (confirm('Are you sure you want to delete this message?')) {
          deleteMessage(id);
        }
      });
    });
  } catch (err) {
    console.error('Messages error:', err);
    tbody.innerHTML = '<tr><td colspan="6">Failed to load messages.</td></tr>';
  }
};

const markMessageRead = async (id) => {
  try {
    const res = await fetch(`${ADMIN_API}/contact/${id}/read`, {
      method: 'PUT',
      credentials: 'include',
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to mark message as read');
    }

    showToast('Message marked as read', 'success');
    loadMessages();
  } catch (err) {
    console.error('Mark read error:', err);
    showToast(err.message, 'error');
  }
};

const deleteMessage = async (id) => {
  try {
    const res = await fetch(`${ADMIN_API}/contact/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to delete message');
    }

    showToast('Message deleted', 'success');
    loadMessages();
  } catch (err) {
    console.error('Delete message error:', err);
    showToast(err.message, 'error');
  }
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const loadSettings = async () => {
  const form = document.getElementById('settings-form');
  if (!form) return;

  try {
    const res = await fetch(`${ADMIN_API}/admin/settings`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load settings');
    }

    const settings = json.data || {};

    // Populate form fields -- settings may be an object or array
    const settingsMap = Array.isArray(settings)
      ? settings.reduce((acc, s) => {
          acc[s.key] = s.value;
          return acc;
        }, {})
      : settings;

    const fields = form.querySelectorAll('[data-setting-key]');
    fields.forEach((field) => {
      const key = field.dataset.settingKey;
      if (settingsMap[key] !== undefined) {
        field.value = settingsMap[key];
      }
    });
  } catch (err) {
    console.error('Settings error:', err);
    showToast('Failed to load settings', 'error');
  }
};

const initSettingsForm = () => {
  const form = document.getElementById('settings-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    const fields = form.querySelectorAll('[data-setting-key]');
    let hasError = false;

    for (const field of fields) {
      const key = field.dataset.settingKey;
      const value = field.value.trim();

      try {
        const res = await fetch(`${ADMIN_API}/admin/settings/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ value }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || `Failed to update ${key}`);
        }
      } catch (err) {
        console.error(`Setting update error for ${key}:`, err);
        hasError = true;
      }
    }

    if (hasError) {
      showToast('Some settings failed to update', 'warning');
    } else {
      showToast('Settings saved successfully', 'success');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Settings';
  });
};

// ---------------------------------------------------------------------------
// Opening Hours
// ---------------------------------------------------------------------------

const loadOpeningHours = async () => {
  const container = document.getElementById('opening-hours-table-body');
  if (!container) return;

  container.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

  try {
    const res = await fetch(`${ADMIN_API}/admin/opening-hours`, {
      credentials: 'include',
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Failed to load opening hours');
    }

    const hours = json.data || [];

    if (hours.length === 0) {
      container.innerHTML = '<tr><td colspan="4">No opening hours configured.</td></tr>';
      return;
    }

    container.innerHTML = hours
      .map(
        (h) => `
      <tr data-id="${h.id}">
        <td>${h.day_of_week || h.day || '-'}</td>
        <td>
          <input type="time" class="form-control hours-open" data-id="${h.id}" value="${h.open_time || h.opening_time || ''}" />
        </td>
        <td>
          <input type="time" class="form-control hours-close" data-id="${h.id}" value="${h.close_time || h.closing_time || ''}" />
        </td>
        <td>
          <button class="btn btn-sm btn-primary btn-save-hours" data-id="${h.id}">Save</button>
        </td>
      </tr>
    `
      )
      .join('');

    // Save individual row handlers
    container.querySelectorAll('.btn-save-hours').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id, 10);
        const row = btn.closest('tr');
        const openTime = row.querySelector('.hours-open')?.value || '';
        const closeTime = row.querySelector('.hours-close')?.value || '';

        btn.disabled = true;

        try {
          const res = await fetch(`${ADMIN_API}/admin/opening-hours/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              open_time: openTime,
              close_time: closeTime,
              opening_time: openTime,
              closing_time: closeTime,
            }),
          });

          const json = await res.json();

          if (!res.ok || !json.success) {
            throw new Error(json.message || 'Failed to update hours');
          }

          showToast('Opening hours updated', 'success');
        } catch (err) {
          console.error('Update hours error:', err);
          showToast(err.message, 'error');
        } finally {
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    console.error('Opening hours error:', err);
    container.innerHTML = '<tr><td colspan="4">Failed to load opening hours.</td></tr>';
  }
};

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

const initLogout = () => {
  const logoutBtn = document.getElementById('admin-logout');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    try {
      await fetch(`${ADMIN_API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore logout errors -- redirect regardless
    }

    window.location.href = '/admin/login';
  });
};

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

const escapeAttr = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

const capitalise = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

// ---------------------------------------------------------------------------
// Toast for admin (reuse from app.js if loaded, otherwise define locally)
// ---------------------------------------------------------------------------

if (typeof showToast === 'undefined') {
  var showToast = (message, type = 'success') => {
    const existing = document.querySelectorAll('.toast-notification');
    existing.forEach((t) => t.remove());

    const colorMap = {
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
    };

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      padding: 14px 24px; border-radius: 8px; color: #fff;
      background: ${colorMap[type] || colorMap.success};
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      font-size: 0.95rem; max-width: 380px;
      animation: toastSlideIn 0.3s ease forwards;
    `;
    toast.textContent = message;

    if (!document.getElementById('toast-keyframes')) {
      const style = document.createElement('style');
      style.id = 'toast-keyframes';
      style.textContent = `
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(40px); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastSlideOut 0.3s ease forwards';
      toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
  };
}

// ---------------------------------------------------------------------------
// Initialise
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  const authenticated = await checkAuth();
  if (!authenticated) return;

  initSidebar();
  initCategoryForm();
  initProductForm();
  initSettingsForm();
  initLogout();

  // Load dashboard by default
  loadDashboard();
});
