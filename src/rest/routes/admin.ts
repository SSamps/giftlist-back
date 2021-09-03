import express, { Router, Request, Response } from 'express';

const router: Router = express.Router();

// @route POST api/admin/error
// @desc Log unhandled front end errors
// @access Public
router.post('/error', async (req: Request, res: Response) => {
    console.log('POST api/error hit');

    console.error('Unhandled react error: ', req.body);
    res.send(200);
});

module.exports = router;
