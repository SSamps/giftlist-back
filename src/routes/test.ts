import express, { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import { check, Result, ValidationError, validationResult } from 'express-validator';
import Test, { ItestData } from '../models/Test';

const router: Router = express.Router();

// @route GET api/test/:userid
// @desc Get a user's test data
// @access Private
router.get('/:userid', auth, async (req: Request, res: Response) => {
    console.log('GET api/test hit');

    const userIdParams = req.params.userid;
    const userIdToken = req.user?._id;

    if (userIdParams !== userIdToken?.toString()) {
        return res.status(401).json({ msg: 'User not authorized' });
    }

    try {
        const testRecord = await Test.findOne({ user: userIdParams });
        if (!testRecord) {
            return res.status(404).json({ msg: 'Test data not found' });
        }
        return res.json(testRecord.testData);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// @route POST api/test/:userid
// @desc Add some test data to a user
// @access Private
router.post(
    '/:userid',
    auth,
    check('testVar', 'testVar is required').not().isEmpty(),
    async (req: Request, res: Response) => {
        console.log('POST api/test hit');

        const userIdParams = req.params.userid;
        const userIdToken = req.user?._id;

        if (userIdParams !== userIdToken?.toString()) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const errors: Result<ValidationError> = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { testVar } = req.body;
        const testData = { testVar };

        try {
            let foundTestData = await Test.findOne({ user: userIdParams });
            if (!foundTestData) {
                const newTestDataRecord: ItestData = new Test({ user: userIdParams, testData: [testData] });
                await newTestDataRecord.save();
                return res.status(200).json(newTestDataRecord.testData);
            } else {
                const updatedTestDataRecord = await Test.findOneAndUpdate(
                    { user: userIdParams },
                    { $push: { testData: testData } },
                    { new: true }
                );
                return res.status(200).json(updatedTestDataRecord?.testData);
            }
        } catch (err) {
            console.log(err.message);
            return res.status(500).send('Server error');
        }
    }
);

// @route DELETE api/test/:userid/:testid
// @desc Delete some test data from a user
// @access Private
router.delete('/:userid/:testid', auth, async (req: Request, res: Response) => {
    console.log('DELETE api/test/:userid/:testid hit');

    const userIdParams = req.params.userid;
    const userIdToken = req.user?._id;
    const testDataId = req.params.testid;

    if (userIdParams !== userIdToken?.toString()) {
        return res.status(401).json({ msg: 'User not authorized' });
    }

    try {
        const foundTestRecord = await Test.findOne({ user: userIdParams, 'testData._id': testDataId });
        if (foundTestRecord) {
            await Test.findOneAndUpdate({ user: userIdParams }, { $pull: { testData: { _id: testDataId } } });
            return res.status(200).json({ msg: 'Test data removed' });
        } else {
            return res.status(404).json({ msg: 'Test data not found' });
        }
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ msg: 'Invalid id' });
        }
        return res.status(500).send('Server error');
    }
});

// @route DELETE api/test/:userid/
// @desc Delete all test data from a user
// @access Private
router.delete('/:userid', auth, async (req: Request, res: Response) => {
    console.log('DELETE api/test/:userid hit');

    const userIdParams = req.params.userid;
    const userIdToken = req.user?._id;

    if (userIdParams !== userIdToken?.toString()) {
        return res.status(401).json({ msg: 'User not authorized' });
    }

    try {
        const foundTestRecord = await Test.findOne({ user: userIdParams });
        if (foundTestRecord) {
            await Test.deleteOne({ user: userIdParams });
            return res.status(200).json({ msg: 'Test data removed' });
        } else {
            return res.status(404).json({ msg: 'Test data not found' });
        }
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ msg: 'Invalid id' });
        }
        return res.status(500).send('Server error');
    }
});

module.exports = router;
