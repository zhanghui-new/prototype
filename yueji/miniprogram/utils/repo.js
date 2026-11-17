// 云端数据仓库：书架 + 打卡记录，全部走云数据库（含 auth gate）
// owner_id 由服务端 DEFAULT auth.uid() 与 RLS 决定，客户端永不发送
const { cloud } = require('./cloud');
const { createTableAccess } = require('./cloud-data-access');

// 书架表访问
const booksTable = createTableAccess(cloud, {
  table: 'books',
  columns: ['id', 'title', 'author', 'pages', 'status', 'current_page', 'rating', 'finished_at', 'cover_cls', 'created_at'],
  orderBy: { column: 'created_at', ascending: false },
  fromRow(row) {
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      pages: row.pages,
      status: row.status,
      currentPage: row.current_page,
      rating: row.rating,
      finishedAt: row.finished_at,
      coverCls: row.cover_cls
    };
  },
  toRow(book) {
    const row = {};
    if (book.title !== undefined) row.title = book.title;
    if (book.author !== undefined) row.author = book.author;
    if (book.pages !== undefined) row.pages = book.pages;
    if (book.status !== undefined) row.status = book.status;
    if (book.currentPage !== undefined) row.current_page = book.currentPage;
    if (book.rating !== undefined) row.rating = book.rating;
    if (book.finishedAt !== undefined) row.finished_at = book.finishedAt;
    if (book.coverCls !== undefined) row.cover_cls = book.coverCls;
    return row;
  }
});

// 打卡记录表访问
const checkinsTable = createTableAccess(cloud, {
  table: 'checkins',
  columns: ['id', 'book_title', 'date', 'minutes', 'streak', 'mood', 'star', 'note', 'quote_text', 'quote_src', 'created_at'],
  orderBy: { column: 'date', ascending: false },
  fromRow(row) {
    return {
      id: row.id,
      bookTitle: row.book_title,
      date: row.date,
      minutes: row.minutes,
      streak: row.streak,
      mood: row.mood,
      star: row.star,
      note: row.note,
      quoteText: row.quote_text || '',
      quoteSrc: row.quote_src || ''
    };
  },
  toRow(record) {
    const row = {};
    if (record.bookTitle !== undefined) row.book_title = record.bookTitle;
    if (record.date !== undefined) row.date = record.date;
    if (record.minutes !== undefined) row.minutes = record.minutes;
    if (record.streak !== undefined) row.streak = record.streak;
    if (record.mood !== undefined) row.mood = record.mood;
    if (record.star !== undefined) row.star = record.star;
    if (record.note !== undefined) row.note = record.note;
    if (record.quoteText !== undefined) row.quote_text = record.quoteText;
    if (record.quoteSrc !== undefined) row.quote_src = record.quoteSrc;
    return row;
  }
});

// 按状态筛选书架（云端 list 后客户端过滤 status）
function listBooksByStatus(status) {
  return booksTable.list().then(({ data, error }) => {
    if (error) return { data: null, error };
    return { data: (data || []).filter(b => b.status === status), error: null };
  });
}

// 全部书架
function listBooks() {
  return booksTable.list();
}

module.exports = {
  booksTable,
  checkinsTable,
  listBooks,
  listBooksByStatus,
  cloud
};
