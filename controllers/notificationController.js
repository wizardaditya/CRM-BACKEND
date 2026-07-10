const notificationRepository = require('../repositories/notificationRepository');
const R = require('../utils/apiResponse');

exports.getMyNotifications = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page  || '1',  10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip  = (page - 1) * limit;

    const [notifications, unreadCount] = await Promise.all([
      notificationRepository.findByUser(req.user.id, { skip, take: limit }),
      notificationRepository.countUnread(req.user.id),
    ]);
    R.success(res, { notifications, unreadCount });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    await notificationRepository.markRead(req.params.id, req.user.id);
    R.success(res, null, 'Marked as read');
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await notificationRepository.markAllRead(req.user.id);
    R.success(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
};
