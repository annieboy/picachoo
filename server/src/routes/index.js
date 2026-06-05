const router = require('express').Router();

router.use(require('./health'));
// Future route modules mount here:
// router.use('/hosts', require('./hosts'));
// router.use('/events', require('./events'));
// router.use('/auth', require('./auth'));
// router.use('/upload', require('./upload'));

module.exports = router;
