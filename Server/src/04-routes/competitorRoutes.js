const express = require('express');
const router = express.Router();
const {
  getCompetitors,
  createCompetitor,
  updateCompetitor,
  deleteCompetitor
} = require('../03-controllers/competitorController');

router.route('/')
  .get(getCompetitors)
  .post(createCompetitor);

router.route('/:id')
  .put(updateCompetitor)
  .delete(deleteCompetitor);

module.exports = router;
