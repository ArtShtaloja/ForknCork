/**
 * Fork n Cork — Admin Dashboard
 * Professional restaurant management dashboard.
 */

// Use the backend URL when frontend is hosted separately (e.g. Render static site)
const API = (() => {
  if (typeof BACKEND_URL !== 'undefined' && BACKEND_URL) {
    return BACKEND_URL.replace(/\/+$/, '') + '/api';
  }
  return '/api';
})();

// ─── State ──────────────────────────────────────────────────────────────
let currentSection = 'dashboard';
let ordersPage = 1;
let productsPage = 1;
let confirmCallback = null;
let ordersChart = null;
let topProductsChart = null;

// ─── Init ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const authenticated = await checkAuth();
  if (!authenticated) return;

  initSidebar();
  initModals();
  initLogout();
  initProductForm();
  initCategoryForm();
  initSettingsForm();
  initImageUploadForm();
  initSearch();
  initTheme();

  loadDashboard();
});

// ─── Auth ───────────────────────────────────────────────────────────────
async function checkAuth() {
  try {
    const res = await fetch(`${API}/auth/profile`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error();
    const el = document.getElementById('admin-user-name');
    if (el && json.data) el.textContent = json.data.name || json.data.email || 'Admin';
    return true;
  } catch {
    window.location.href = '/admin/login';
    return false;
  }
}

// ─── Sidebar Navigation ─────────────────────────────────────────────────
function initSidebar() {
  const navItems = document.querySelectorAll('.admin-nav-item[data-section]');
  const sections = document.querySelectorAll('.admin-section');
  const sidebar = document.getElementById('admin-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggle = document.getElementById('sidebar-toggle');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.section;
      navigateSection(target);
      // Close mobile sidebar
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  });

  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    });
  }
}

function navigateSection(target) {
  const navItems = document.querySelectorAll('.admin-nav-item[data-section]');
  const sections = document.querySelectorAll('.admin-section');

  navItems.forEach(l => l.classList.toggle('active', l.dataset.section === target));
  sections.forEach(s => s.classList.toggle('active', s.id === `section-${target}`));

  currentSection = target;
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) {
    titleEl.textContent = I18n.t(`admin.nav.${target}`);
    titleEl.dataset.i18n = `admin.nav.${target}`;
  }

  loadSectionData(target);
}

function loadSectionData(section) {
  switch (section) {
    case 'dashboard': loadDashboard(); break;
    case 'orders': loadOrders(); break;
    case 'products': loadProducts(); break;
    case 'categories': loadCategories(); break;
    case 'images': loadImages(); break;
    case 'messages': loadMessages(); break;
    case 'settings': loadSettings(); loadOpeningHours(); break;
  }
}

// ─── Modal System ───────────────────────────────────────────────────────
function initModals() {
  // Close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.closeModal;
      closeModal(id);
    });
  });

  // Click outside to close
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function confirmDelete(name, callback) {
  document.getElementById('confirm-item-name').textContent = name;
  confirmCallback = callback;
  openModal('confirm-modal');
}

// Confirm button handler
document.addEventListener('click', (e) => {
  if (e.target.closest('#confirm-delete-btn')) {
    if (confirmCallback) {
      confirmCallback();
      confirmCallback = null;
    }
    closeModal('confirm-modal');
  }
});

// ─── Dashboard ──────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const res = await fetch(`${API}/admin/analytics`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);

    const d = json.data;

    setText('stat-total-orders', d.total_orders || 0);
    setText('stat-total-revenue', formatPrice(d.total_revenue));
    setText('stat-today-orders', d.orders_today || 0);
    setText('stat-today-revenue', formatPrice(d.revenue_today));
    setText('stat-week-revenue', formatPrice(d.revenue_week));
    setText('stat-products', d.total_products || 0);
    setText('stat-categories', d.total_categories || 0);
    setText('stat-unread', d.unread_messages || 0);

    // Badges
    const pendingCount = (d.orders_by_status || []).find(s => s.status === 'pending')?.count || 0;
    const pendingBadge = document.getElementById('pending-badge');
    if (pendingBadge) pendingBadge.textContent = pendingCount > 0 ? pendingCount : '';
    const unreadBadge = document.getElementById('unread-badge');
    if (unreadBadge) unreadBadge.textContent = (d.unread_messages || 0) > 0 ? d.unread_messages : '';

    // Charts
    renderOrdersChart(d.daily_orders || []);
    renderTopProductsChart(d.top_products || []);

    // Recent orders table
    renderRecentOrders(d.recent_orders || []);
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

function renderOrdersChart(dailyData) {
  const ctx = document.getElementById('orders-chart');
  if (!ctx) return;

  const labels = dailyData.map(d => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-IE', { month: 'short', day: 'numeric' });
  });
  const orderCounts = dailyData.map(d => d.count);
  const revenues = dailyData.map(d => parseFloat(d.revenue) || 0);

  if (ordersChart) ordersChart.destroy();

  ordersChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Orders',
          data: orderCounts,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderRadius: 6,
          yAxisID: 'y',
          order: 2,
        },
        {
          label: 'Revenue (€)',
          data: revenues,
          type: 'line',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#10b981',
          fill: true,
          tension: 0.3,
          yAxisID: 'y1',
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 16, font: { size: 12, family: "'Inter', sans-serif" } } },
      },
      scales: {
        y: { beginAtZero: true, position: 'left', ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: '#f1f5f9' } },
        y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: v => '€' + v, font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  });
}

function renderTopProductsChart(products) {
  const ctx = document.getElementById('top-products-chart');
  if (!ctx) return;

  const labels = products.slice(0, 8).map(p => p.name || `Product #${p.product_id}`);
  const data = products.slice(0, 8).map(p => p.total_sold);

  const colors = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
    '#8b5cf6', '#ec4899', '#14b8a6',
  ];

  if (topProductsChart) topProductsChart.destroy();

  topProductsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, padding: 12, font: { size: 11, family: "'Inter', sans-serif" } },
        },
      },
    },
  });
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recent-orders-body');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No orders yet</td></tr>';
    return;
  }

  tbody.innerHTML = orders.slice(0, 8).map(o => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${esc(o.customer_name || '-')}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(o.item_names || '-')}</td>
      <td><strong>${formatPrice(o.total_amount)}</strong></td>
      <td>${statusBadge(o.status)}</td>
      <td>${formatDate(o.created_at)}</td>
    </tr>
  `).join('');
}

// ─── Orders ─────────────────────────────────────────────────────────────
async function loadOrders() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" class="table-empty"><div class="admin-spinner"></div></td></tr>';

  const status = document.getElementById('orders-status-filter')?.value || '';
  const search = document.getElementById('orders-search')?.value?.trim() || '';

  try {
    let url = `${API}/orders?page=${ordersPage}&limit=15`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res = await fetch(url, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);

    const orders = json.data || [];

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No orders found</td></tr>';
      renderPagination('orders-pagination', 0, 15, ordersPage, p => { ordersPage = p; loadOrders(); });
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>#${o.id}</strong></td>
        <td>
          <div style="font-weight:500;">${esc(o.customer_name || '-')}</div>
          <div style="font-size:0.78rem;color:var(--admin-text-dim);">${esc(o.customer_email || '')}</div>
        </td>
        <td>${typeBadge(o.order_type)}</td>
        <td><strong>${formatPrice(o.total_amount)}</strong></td>
        <td>
          <select class="status-select" data-order-id="${o.id}" onchange="updateOrderStatus(${o.id}, this.value)">
            ${['pending','confirmed','preparing','ready','completed','cancelled'].map(s =>
              `<option value="${s}" ${o.status === s ? 'selected' : ''}>${cap(s)}</option>`
            ).join('')}
          </select>
        </td>
        <td>${formatDate(o.created_at)}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-action" title="View" onclick="viewOrder(${o.id})"><i class="fas fa-eye"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    const total = json.pagination?.total || orders.length;
    renderPagination('orders-pagination', total, 15, ordersPage, p => { ordersPage = p; loadOrders(); });
  } catch (err) {
    console.error('Orders error:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Failed to load orders</td></tr>';
  }
}

async function viewOrder(id) {
  const body = document.getElementById('order-detail-body');
  body.innerHTML = '<div class="admin-spinner"></div>';
  document.getElementById('order-modal-title').textContent = `Order #${id}`;
  openModal('order-modal');

  try {
    const res = await fetch(`${API}/orders/${id}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);

    const o = json.data;
    const items = o.items || [];

    body.innerHTML = `
      <div class="order-detail-grid">
        <div>
          <h4>Customer Info</h4>
          <p><strong>Name:</strong> ${esc(o.customer_name || '-')}</p>
          <p><strong>Email:</strong> ${esc(o.customer_email || '-')}</p>
          <p><strong>Phone:</strong> ${esc(o.customer_phone || '-')}</p>
          <p><strong>Type:</strong> ${typeBadge(o.order_type)}</p>
          <p><strong>Status:</strong> ${statusBadge(o.status)}</p>
          ${o.customer_address ? `<p><strong>Address:</strong> ${esc(o.customer_address)}</p>` : ''}
          ${o.notes ? `<p><strong>Notes:</strong> ${esc(o.notes)}</p>` : ''}
          <p><strong>Date:</strong> ${formatDate(o.created_at)}</p>
        </div>
        <div>
          <h4>Order Items</h4>
          ${items.length > 0 ? `
            <table class="order-items-table">
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${esc(item.product_name || `Product #${item.product_id}`)}</td>
                    <td>${item.quantity}</td>
                    <td>${formatPrice(item.unit_price)}</td>
                    <td>${formatPrice(item.subtotal || item.unit_price * item.quantity)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>No items</p>'}
          <div class="order-total">Total: ${formatPrice(o.total_amount)}</div>
        </div>
      </div>
    `;
  } catch (err) {
    body.innerHTML = '<p style="color:var(--admin-danger);">Failed to load order details.</p>';
  }
}

async function updateOrderStatus(id, status) {
  try {
    const res = await fetch(`${API}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);
    showToast(`Order #${id} → ${cap(status)}`, 'success');
  } catch (err) {
    showToast(err.message || I18n.t('admin.notifications.error'), 'error');
    loadOrders();
  }
}

// ─── Products ───────────────────────────────────────────────────────────
async function loadProducts() {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" class="table-empty"><div class="admin-spinner"></div></td></tr>';

  const search = document.getElementById('products-search')?.value?.trim() || '';
  const categoryId = document.getElementById('products-category-filter')?.value || '';

  try {
    let url = `${API}/products?page=${productsPage}&limit=15`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (categoryId) url += `&category_id=${categoryId}`;

    const res = await fetch(url, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);

    const products = json.data || [];

    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No products found</td></tr>';
      renderPagination('products-pagination', 0, 15, productsPage, p => { productsPage = p; loadProducts(); });
      return;
    }

    tbody.innerHTML = products.map(p => {
      const img = resolveImage(p);
      return `
        <tr>
          <td><img src="${img}" alt="${esc(p.name)}" class="table-thumb" onerror="this.src='/images/forkncork1.jpg'"></td>
          <td>
            <div style="font-weight:600;">${esc(p.name)}</div>
            <div style="font-size:0.78rem;color:var(--admin-text-dim);">${esc((p.description || '').substring(0, 60))}</div>
          </td>
          <td>${esc(p.category_name || '-')}</td>
          <td><strong>${formatPrice(p.price)}</strong></td>
          <td>${p.is_featured ? '<span class="badge badge-warning">Featured</span>' : '<span class="badge badge-secondary">No</span>'}</td>
          <td>${p.is_available !== 0 ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-danger">No</span>'}</td>
          <td>
            <div class="actions-cell">
              <button class="btn-action" title="Edit" onclick="editProduct(${p.id})"><i class="fas fa-pen"></i></button>
              <button class="btn-action action-danger" title="Delete" onclick="deleteProduct(${p.id}, '${esc(p.name)}')"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const total = json.pagination?.total || products.length;
    renderPagination('products-pagination', total, 15, productsPage, p => { productsPage = p; loadProducts(); });
  } catch (err) {
    console.error('Products error:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Failed to load products</td></tr>';
  }
}

function initProductForm() {
  const form = document.getElementById('product-form');
  if (!form) return;

  // Dropzone
  const dropzone = document.getElementById('product-dropzone');
  const fileInput = document.getElementById('product-image-input');
  const preview = document.getElementById('product-image-preview');
  const previewImg = document.getElementById('product-preview-img');
  const removeBtn = document.getElementById('product-remove-preview');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        showImagePreview(fileInput.files[0], previewImg, preview, dropzone);
      }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) showImagePreview(fileInput.files[0], previewImg, preview, dropzone);
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      fileInput.value = '';
      preview.style.display = 'none';
      dropzone.style.display = '';
    });
  }

  // Add button
  document.getElementById('add-product-btn')?.addEventListener('click', () => {
    resetProductForm();
    loadProductCategories();
    document.getElementById('product-modal-title').textContent = 'Add Product';
    openModal('product-modal');
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('product-name').value.trim();
    const price = document.getElementById('product-price').value;
    const categoryId = document.getElementById('product-category').value;

    if (!name) { showToast(I18n.t('admin.notifications.productNameRequired'), 'error'); return; }
    if (!price || parseFloat(price) < 0) { showToast(I18n.t('admin.notifications.priceRequired'), 'error'); return; }
    if (!categoryId) { showToast(I18n.t('admin.notifications.categoryRequired'), 'error'); return; }

    const saveBtn = document.getElementById('product-save-btn');
    saveBtn.disabled = true;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', document.getElementById('product-description').value.trim());
    formData.append('price', price);
    formData.append('category_id', categoryId);
    formData.append('is_featured', document.getElementById('product-featured').checked ? '1' : '0');
    formData.append('is_available', document.getElementById('product-available').checked ? '1' : '0');

    const imgInput = document.getElementById('product-image-input');
    if (imgInput?.files.length) formData.append('image', imgInput.files[0]);

    const editId = document.getElementById('product-edit-id').value;
    const isEdit = !!editId;

    try {
      const res = await fetch(isEdit ? `${API}/products/${editId}` : `${API}/products`, {
        method: isEdit ? 'PUT' : 'POST',
        credentials: 'include',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      showToast(isEdit ? I18n.t('admin.notifications.productUpdated') : I18n.t('admin.notifications.productCreated'), 'success');
      closeModal('product-modal');
      loadProducts();
    } catch (err) {
      showToast(err.message || I18n.t('admin.notifications.error'), 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });
}

async function editProduct(id) {
  try {
    const res = await fetch(`${API}/products/${id}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);

    const p = json.data;
    await loadProductCategories();

    document.getElementById('product-edit-id').value = p.id;
    document.getElementById('product-name').value = p.name || '';
    document.getElementById('product-description').value = p.description || '';
    document.getElementById('product-price').value = p.price || '';
    document.getElementById('product-category').value = p.category_id || '';
    document.getElementById('product-featured').checked = !!p.is_featured;
    document.getElementById('product-available').checked = p.is_available !== 0;

    // Show current image
    const img = resolveImage(p);
    const preview = document.getElementById('product-image-preview');
    const previewImg = document.getElementById('product-preview-img');
    const dropzone = document.getElementById('product-dropzone');
    previewImg.src = img;
    preview.style.display = '';
    dropzone.style.display = 'none';

    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('product-save-btn').innerHTML = '<i class="fas fa-save"></i> Update Product';
    openModal('product-modal');
  } catch (err) {
    showToast(err.message || 'Failed to load product', 'error');
  }
}

function deleteProduct(id, name) {
  confirmDelete(name, async () => {
    try {
      const res = await fetch(`${API}/products/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      showToast(I18n.t('admin.notifications.productDeleted'), 'success');
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  });
}

function resetProductForm() {
  document.getElementById('product-form').reset();
  document.getElementById('product-edit-id').value = '';
  document.getElementById('product-available').checked = true;
  document.getElementById('product-image-preview').style.display = 'none';
  document.getElementById('product-dropzone').style.display = '';
  document.getElementById('product-save-btn').innerHTML = '<i class="fas fa-save"></i> Save Product';
}

async function loadProductCategories() {
  const selects = [
    document.getElementById('product-category'),
    document.getElementById('products-category-filter')
  ];
  
  try {
    const res = await fetch(`${API}/categories`, { credentials: 'include' });
    const json = await res.json();
    if (res.ok && json.success) {
      const categories = json.data || [];
      const optionsHtml = categories.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
      
      selects.forEach(select => {
        if (!select) return;
        const defaultValue = select.id === 'product-category' ? 'Select category' : 'All Categories';
        select.innerHTML = `<option value="">${defaultValue}</option>` + optionsHtml;
      });
    }
  } catch {}
}

// ─── Categories ─────────────────────────────────────────────────────────
async function loadCategories() {
  const tbody = document.getElementById('categories-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" class="table-empty"><div class="admin-spinner"></div></td></tr>';

  try {
    const res = await fetch(`${API}/categories`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);

    let categories = json.data || [];
    const search = document.getElementById('categories-search')?.value?.trim()?.toLowerCase();

    if (search) {
      categories = categories.filter(c =>
        (c.name || '').toLowerCase().includes(search) ||
        (c.description || '').toLowerCase().includes(search) ||
        (c.slug || '').toLowerCase().includes(search)
      );
    }

    if (categories.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No categories found</td></tr>';
      return;
    }

    tbody.innerHTML = categories.map(c => `
      <tr>
        <td><strong>${esc(c.name)}</strong></td>
        <td style="font-family:var(--admin-font-mono);font-size:0.8rem;color:var(--admin-text-dim);">${esc(c.slug || '')}</td>
        <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(c.description || '-')}</td>
        <td>${c.is_active !== 0 ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-secondary">Inactive</span>'}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-action" title="Edit" onclick="editCategory(${c.id}, '${esc(c.name)}', '${esc(c.description || '')}')"><i class="fas fa-pen"></i></button>
            <button class="btn-action action-danger" title="Delete" onclick="deleteCategory(${c.id}, '${esc(c.name)}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Categories error:', err);
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Failed to load categories</td></tr>';
  }
}

function initCategoryForm() {
  const form = document.getElementById('category-form');
  if (!form) return;

  document.getElementById('add-category-btn')?.addEventListener('click', () => {
    resetCategoryForm();
    document.getElementById('category-modal-title').textContent = 'Add Category';
    openModal('category-modal');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('category-name').value.trim();
    if (!name) { showToast(I18n.t('admin.notifications.categoryNameRequired'), 'error'); return; }

    const saveBtn = document.getElementById('category-save-btn');
    saveBtn.disabled = true;

    const editId = document.getElementById('category-edit-id').value;
    const isEdit = !!editId;
    const description = document.getElementById('category-description').value.trim();

    try {
      const res = await fetch(isEdit ? `${API}/categories/${editId}` : `${API}/categories`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      showToast(isEdit ? I18n.t('admin.notifications.categoryUpdated') : I18n.t('admin.notifications.categoryCreated'), 'success');
      closeModal('category-modal');
      loadCategories();
    } catch (err) {
      showToast(err.message || I18n.t('admin.notifications.error'), 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });
}

function editCategory(id, name, description) {
  document.getElementById('category-edit-id').value = id;
  document.getElementById('category-name').value = name;
  document.getElementById('category-description').value = description;
  document.getElementById('category-modal-title').textContent = 'Edit Category';
  document.getElementById('category-save-btn').innerHTML = '<i class="fas fa-save"></i> Update';
  openModal('category-modal');
}

function deleteCategory(id, name) {
  confirmDelete(name, async () => {
    try {
      const res = await fetch(`${API}/categories/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      showToast(I18n.t('admin.notifications.categoryDeleted'), 'success');
      loadCategories();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  });
}

function resetCategoryForm() {
  document.getElementById('category-form').reset();
  document.getElementById('category-edit-id').value = '';
  document.getElementById('category-save-btn').innerHTML = '<i class="fas fa-save"></i> Save';
}

// ─── Images ─────────────────────────────────────────────────────────────
async function loadImages() {
  const grid = document.getElementById('images-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="admin-spinner"></div>';

  try {
    const res = await fetch(`${API}/admin/images`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);

    let images = json.data || [];
    const search = document.getElementById('images-search')?.value?.trim()?.toLowerCase();

    if (search) {
      images = images.filter(img =>
        (img.filename || '').toLowerCase().includes(search)
      );
    }

    if (images.length === 0) {
      grid.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>No images uploaded yet</p></div>';
      return;
    }

    grid.innerHTML = images.map(img => `
      <div class="image-card">
        <img src="${img.url}" alt="${esc(img.filename)}" loading="lazy">
        <div class="image-card-info">
          <div class="filename">${esc(img.filename)}</div>
          <div class="filesize">${formatFileSize(img.size)}</div>
        </div>
        <div class="image-card-actions">
          <button title="Delete" onclick="deleteImage('${esc(img.filename)}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Images error:', err);
    grid.innerHTML = '<div class="empty-state"><p>Failed to load images</p></div>';
  }
}

function initImageUploadForm() {
  const form = document.getElementById('image-upload-form');
  if (!form) return;

  const dropzone = document.getElementById('image-dropzone');
  const fileInput = document.getElementById('image-upload-input');
  const preview = document.getElementById('image-upload-preview');
  const previewImg = document.getElementById('image-upload-preview-img');

  document.getElementById('upload-image-btn')?.addEventListener('click', () => {
    form.reset();
    preview.style.display = 'none';
    openModal('image-upload-modal');
  });

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        showImagePreview(fileInput.files[0], previewImg, preview);
      }
    });
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length) showImagePreview(fileInput.files[0], previewImg, preview);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileInput?.files.length) { showToast(I18n.t('admin.notifications.imageRequired'), 'error'); return; }

    const btn = document.getElementById('image-upload-btn');
    btn.disabled = true;

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    try {
      const res = await fetch(`${API}/admin/images`, { method: 'POST', credentials: 'include', body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);

      showToast(I18n.t('admin.notifications.imageUploaded'), 'success');
      closeModal('image-upload-modal');
      loadImages();
    } catch (err) {
      showToast(err.message || I18n.t('admin.notifications.error'), 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

function deleteImage(filename) {
  confirmDelete(filename, async () => {
    try {
      const res = await fetch(`${API}/admin/images/${encodeURIComponent(filename)}`, {
        method: 'DELETE', credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      showToast(I18n.t('admin.notifications.imageDeleted'), 'success');
      loadImages();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  });
}

// ─── Messages ───────────────────────────────────────────────────────────
async function loadMessages() {
  const tbody = document.getElementById('messages-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" class="table-empty"><div class="admin-spinner"></div></td></tr>';

  try {
    const res = await fetch(`${API}/contact`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);

    let messages = json.data || [];
    const search = document.getElementById('messages-search')?.value?.trim()?.toLowerCase();

    if (search) {
      messages = messages.filter(m =>
        (m.name || '').toLowerCase().includes(search) ||
        (m.email || '').toLowerCase().includes(search) ||
        (m.subject || '').toLowerCase().includes(search) ||
        (m.message || '').toLowerCase().includes(search)
      );
    }

    if (messages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No messages</td></tr>';
      return;
    }

    tbody.innerHTML = messages.map(m => `
      <tr class="${m.is_read ? '' : 'unread-row'}">
        <td style="width:30px;">${m.is_read ? '<i class="fas fa-envelope-open" style="color:var(--admin-text-dim);"></i>' : '<i class="fas fa-envelope" style="color:var(--admin-primary);"></i>'}</td>
        <td><strong>${esc(m.name || '-')}</strong></td>
        <td>${esc(m.email || '-')}</td>
        <td>${esc(m.subject || '-')}</td>
        <td>${formatDate(m.created_at)}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-action" title="View" onclick="viewMessage(${m.id})"><i class="fas fa-eye"></i></button>
            ${!m.is_read ? `<button class="btn-action action-success" title="Mark Read" onclick="markMessageRead(${m.id})"><i class="fas fa-check"></i></button>` : ''}
            <button class="btn-action action-danger" title="Delete" onclick="deleteMessage(${m.id})"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Messages error:', err);
    tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Failed to load messages</td></tr>';
  }
}

async function viewMessage(id) {
  const body = document.getElementById('message-detail-body');
  body.innerHTML = '<div class="admin-spinner"></div>';
  openModal('message-modal');

  try {
    const res = await fetch(`${API}/contact/${id}`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);

    const m = json.data;
    document.getElementById('message-modal-title').textContent = m.subject || 'Message';

    body.innerHTML = `
      <div class="message-content-box">
        <p><strong>From:</strong> ${esc(m.name)} &lt;${esc(m.email)}&gt;</p>
        ${m.phone ? `<p><strong>Phone:</strong> ${esc(m.phone)}</p>` : ''}
        <p><strong>Date:</strong> ${formatDate(m.created_at)}</p>
        <hr>
        <p style="white-space:pre-wrap;">${esc(m.message || '')}</p>
      </div>
      <div class="form-actions" style="margin-top:16px;">
        ${!m.is_read ? `<button class="btn btn-success btn-sm" onclick="markMessageRead(${m.id});closeModal('message-modal');"><i class="fas fa-check"></i> Mark as Read</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="deleteMessage(${m.id});closeModal('message-modal');"><i class="fas fa-trash"></i> Delete</button>
      </div>
    `;

    // Auto-mark as read
    if (!m.is_read) {
      await fetch(`${API}/contact/${id}/read`, { method: 'PUT', credentials: 'include' });
    }
  } catch (err) {
    body.innerHTML = '<p style="color:var(--admin-danger);">Failed to load message.</p>';
  }
}

async function markMessageRead(id) {
  try {
    const res = await fetch(`${API}/contact/${id}/read`, { method: 'PUT', credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);
    showToast(I18n.t('admin.notifications.messageMarkedRead'), 'success');
    loadMessages();
  } catch (err) {
    showToast(I18n.t('admin.notifications.error'), 'error');
  }
}

async function deleteMessage(id) {
  confirmDelete('this message', async () => {
    try {
      const res = await fetch(`${API}/contact/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      showToast(I18n.t('admin.notifications.messageDeleted'), 'success');
      loadMessages();
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  });
}

// ─── Settings ───────────────────────────────────────────────────────────
async function loadSettings() {
  try {
    const res = await fetch(`${API}/admin/settings`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);

    const settings = json.data || [];
    const map = Array.isArray(settings)
      ? settings.reduce((acc, s) => { acc[s.setting_key] = s.setting_value; return acc; }, {})
      : settings;

    document.querySelectorAll('[data-setting-key]').forEach(field => {
      const key = field.dataset.settingKey;
      if (map[key] !== undefined) field.value = map[key];
    });
  } catch (err) {
    console.error('Settings error:', err);
  }
}

function initSettingsForm() {
  const form = document.getElementById('settings-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    const fields = form.querySelectorAll('[data-setting-key]');
    let hasError = false;

    for (const field of fields) {
      try {
        const res = await fetch(`${API}/admin/settings/${field.dataset.settingKey}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ value: field.value.trim() }),
        });
        if (!res.ok) hasError = true;
      } catch {
        hasError = true;
      }
    }

    showToast(hasError ? I18n.t('admin.notifications.settingsError') : I18n.t('admin.notifications.settingsSaved'), hasError ? 'warning' : 'success');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Save Settings';
  });
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function loadOpeningHours() {
  const tbody = document.getElementById('hours-table-body');
  if (!tbody) return;

  try {
    const res = await fetch(`${API}/admin/opening-hours`, { credentials: 'include' });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);

    const hours = json.data || [];

    if (hours.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No opening hours configured</td></tr>';
      return;
    }

    tbody.innerHTML = hours.map(h => `
      <tr>
        <td style="font-weight:500;">${DAY_NAMES[h.day_of_week] || `Day ${h.day_of_week}`}</td>
        <td><input type="time" class="form-input" style="width:auto;padding:6px 10px;" value="${h.open_time || ''}" data-hours-id="${h.id}" data-field="open_time"></td>
        <td><input type="time" class="form-input" style="width:auto;padding:6px 10px;" value="${h.close_time || ''}" data-hours-id="${h.id}" data-field="close_time"></td>
        <td><input type="checkbox" ${h.is_closed ? 'checked' : ''} data-hours-id="${h.id}" data-field="is_closed" style="accent-color:var(--admin-primary);width:18px;height:18px;"></td>
        <td><button class="btn btn-sm btn-primary" onclick="saveHoursRow(${h.id}, this)"><i class="fas fa-save"></i></button></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Hours error:', err);
    tbody.innerHTML = '<tr><td colspan="5">Failed to load</td></tr>';
  }
}

async function saveHoursRow(id, btn) {
  const row = btn.closest('tr');
  const openTime = row.querySelector('[data-field="open_time"]').value;
  const closeTime = row.querySelector('[data-field="close_time"]').value;
  const isClosed = row.querySelector('[data-field="is_closed"]').checked ? 1 : 0;

  btn.disabled = true;

  try {
    const res = await fetch(`${API}/admin/opening-hours/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ open_time: openTime, close_time: closeTime, is_closed: isClosed }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message);
    showToast(I18n.t('admin.notifications.hoursUpdated'), 'success');
  } catch (err) {
    showToast(err.message || I18n.t('admin.notifications.error'), 'error');
  } finally {
    btn.disabled = false;
  }
}

// ─── Logout ─────────────────────────────────────────────────────────────
function initLogout() {
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {}
    window.location.href = '/admin/login';
  });
}

// ─── Search ─────────────────────────────────────────────────────────────
function initSearch() {
  // Debounced search handlers
  const ordersSearch = document.getElementById('orders-search');
  const productsSearch = document.getElementById('products-search');
  const ordersFilter = document.getElementById('orders-status-filter');
  const productsCatFilter = document.getElementById('products-category-filter');
  const categoriesSearch = document.getElementById('categories-search');
  const imagesSearch = document.getElementById('images-search');
  const messagesSearch = document.getElementById('messages-search');

  if (ordersSearch) {
    ordersSearch.addEventListener('input', debounce(() => { ordersPage = 1; loadOrders(); }, 400));
  }
  if (productsSearch) {
    productsSearch.addEventListener('input', debounce(() => { productsPage = 1; loadProducts(); }, 400));
  }
  if (ordersFilter) {
    ordersFilter.addEventListener('change', () => { ordersPage = 1; loadOrders(); });
  }
  if (productsCatFilter) {
    productsCatFilter.addEventListener('change', () => { productsPage = 1; loadProducts(); });
  }
  if (categoriesSearch) {
    categoriesSearch.addEventListener('input', debounce(() => loadCategories(), 300));
  }
  if (imagesSearch) {
    imagesSearch.addEventListener('input', debounce(() => loadImages(), 300));
  }
  if (messagesSearch) {
    messagesSearch.addEventListener('input', debounce(() => loadMessages(), 300));
  }
}

// ─── Pagination ─────────────────────────────────────────────────────────
function renderPagination(containerId, total, limit, currentPage, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  html += `<button class="page-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="void(0)" data-page="${currentPage - 1}">&laquo;</button>`;

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  if (start > 1) html += `<button class="page-btn" data-page="1">1</button>`;
  if (start > 2) html += `<span style="padding:0 4px;color:var(--admin-text-dim);">...</span>`;

  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  if (end < totalPages - 1) html += `<span style="padding:0 4px;color:var(--admin-text-dim);">...</span>`;
  if (end < totalPages) html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;

  html += `<button class="page-btn" ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">&raquo;</button>`;

  container.innerHTML = html;

  container.querySelectorAll('.page-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page, 10);
      if (page && page !== currentPage) onPageChange(page);
    });
  });
}

// ─── Utilities ──────────────────────────────────────────────────────────
function formatPrice(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return `\u20AC${num.toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-IE', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function cap(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function statusBadge(status) {
  const colors = { pending: 'warning', confirmed: 'info', preparing: 'primary', ready: 'success', completed: 'dark', cancelled: 'danger' };
  return `<span class="badge badge-${colors[status] || 'secondary'}">${cap(status || 'unknown')}</span>`;
}

function typeBadge(type) {
  const colors = { 'dine-in': 'primary', takeaway: 'info', delivery: 'success' };
  return `<span class="badge badge-${colors[type] || 'secondary'}">${cap((type || '').replace('-', ' '))}</span>`;
}

function resolveImage(product) {
  if (product.image_url) {
    return product.image_url.replace('/images/products/', '/images/menu/');
  }
  const name = (product.name || '').trim();
  if (name) {
    return '/images/menu/' + name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + '.jpg';
  }
  return '/images/forkncork1.jpg';
}

function showImagePreview(file, imgEl, containerEl, hideEl) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    imgEl.src = e.target.result;
    containerEl.style.display = '';
    if (hideEl) hideEl.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Toast ──────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  document.querySelectorAll('.admin-toast').forEach(t => t.remove());

  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-circle', info: 'fa-info-circle' };

  const toast = document.createElement('div');
  toast.className = `admin-toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i> ${esc(message)}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}
// ─── Theme ──────────────────────────────────────────────────────────────
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const currentTheme = localStorage.getItem('admin-theme') || 'light';
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    const theme = isDark ? 'dark' : 'light';
    localStorage.setItem('admin-theme', theme);
    
    // Update icon
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    
    // Smooth transition
    themeToggle.style.transform = 'scale(0.9)';
    setTimeout(() => themeToggle.style.transform = 'scale(1)', 100);
  });
}
