const $ = id => document.getElementById(id);
let events = [];
let displayed = [];
let requestNumber = 0;

async function api(path, options = {}) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Không thực hiện được yêu cầu.');
  return data;
}

function time(value) {
  return new Date(value).toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh', hour12: false});
}

function render() {
  const direction = $('direction-filter').value;
  displayed = events.filter(event => !direction || event.direction === direction);
  $('total').textContent = displayed.length;
  $('entries').textContent = displayed.filter(event => event.direction === 'in').length;
  $('exits').textContent = displayed.filter(event => event.direction === 'out').length;
  $('students').textContent = new Set(displayed.map(event => event.student_id)).size;
  $('rows').replaceChildren();
  for (const event of displayed) {
    const row = document.createElement('tr');
    const values = [event.student_id, event.room_id, event.direction === 'in' ? 'Vào phòng' : 'Ra phòng', time(event.occurred_at), event.source === 'manual' ? 'Thủ công' : event.source];
    values.forEach((value, index) => {
      const cell = document.createElement('td');
      if (index === 2) {
        const badge = document.createElement('span');
        badge.className = `badge ${event.direction === 'in' ? 'in' : 'out'}`;
        badge.textContent = value;
        cell.append(badge);
      } else cell.textContent = value;
      row.append(cell);
    });
    $('rows').append(row);
  }
  if (!displayed.length) empty('Chưa có sự kiện phù hợp. Bạn có thể ghi sự kiện thử bằng form bên cạnh.');
  $('export').disabled = !displayed.length;
  $('count-note').textContent = `Hiển thị ${displayed.length} sự kiện · Truy vấn tối đa 1.000 bản ghi mới nhất.`;
}

function empty(message) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = 5;
  cell.className = 'empty';
  cell.textContent = message;
  row.append(cell);
  $('rows').replaceChildren(row);
}

async function load() {
  const current = ++requestNumber;
  const query = new URLSearchParams({limit: '1000'});
  const filters = new FormData($('filters'));
  for (const [key, value] of filters) if (value.trim()) query.set(key, value.trim());
  $('connection').textContent = 'Đang tải…';
  try {
    const data = await api(`/api/events?${query}`);
    if (current !== requestNumber) return;
    events = data.events;
    render();
    $('connection').textContent = '● Đã kết nối';
    $('updated').textContent = `Cập nhật ${time(new Date())} · Giờ Việt Nam`;
  } catch (error) {
    if (current !== requestNumber) return;
    events = [];
    render();
    empty(`Không tải được lịch sử: ${error.message} Bấm Làm mới để thử lại.`);
    $('connection').textContent = '● Mất kết nối';
    $('updated').textContent = 'Chưa tải được dữ liệu';
  }
}

$('filters').addEventListener('submit', event => {event.preventDefault(); load();});
$('direction-filter').addEventListener('change', render);
$('refresh').addEventListener('click', load);
$('record-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('save');
  button.disabled = true;
  $('feedback').textContent = 'Đang lưu…';
  $('feedback').className = '';
  const data = Object.fromEntries(new FormData(event.target));
  data.student_id = data.student_id.trim();
  data.room_id = data.room_id.trim();
  data.event_key = crypto.randomUUID();
  try {
    await api('/api/events', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
    $('feedback').textContent = 'Đã lưu sự kiện. Bộ lọc hiện tại có thể ẩn bản ghi mới.';
    $('feedback').className = 'success';
    await load();
  } catch (error) {
    $('feedback').textContent = error.message;
    $('feedback').className = 'error';
  } finally {button.disabled = false;}
});
$('export').addEventListener('click', () => {
  const quote = value => {
    let text = String(value ?? '');
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = [['Mã sinh viên', 'Phòng', 'Sự kiện', 'Thời gian (Việt Nam)', 'Nguồn'], ...displayed.map(event => [event.student_id, event.room_id, event.direction === 'in' ? 'Vào' : 'Ra', time(event.occurred_at), event.source])];
  const blob = new Blob(['\uFEFF' + rows.map(row => row.map(quote).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'lich-su-ra-vao.csv'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
load();
