const router = require('express').Router();

router.use(require('./health'));
router.use('/auth',   require('./auth'));
router.use('/hosts',  require('./hosts'));
router.use('/events', require('./events'));
router.use(require('./upload'));

module.exports = router;
