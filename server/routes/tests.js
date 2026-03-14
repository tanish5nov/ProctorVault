const express = require('express');
const {
  getTests,
  createTest,
  updateTest,
  deleteTest,
} = require('../controllers/testController');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(auth, isAdmin);

router.get('/', getTests);
router.post('/', createTest);
router.put('/:id', updateTest);
router.delete('/:id', deleteTest);

module.exports = router;
