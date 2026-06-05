const router = require('express').Router();

router.use(require('./health'));
router.use('/auth', require('./auth'));
// Future route modules mount here:
// router.use('/hosts', require('./hosts'));
// router.use('/events', require('./events'));
// router.use('/upload', require('./upload'));

module.exports = router;
