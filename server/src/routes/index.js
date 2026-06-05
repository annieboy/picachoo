const router = require('express').Router();

router.use(require('./health'));
router.use('/auth', require('./auth'));
router.use(require('./upload'));
// Future route modules mount here:
// router.use('/hosts', require('./hosts'));
// router.use('/events', require('./events'));

module.exports = router;
