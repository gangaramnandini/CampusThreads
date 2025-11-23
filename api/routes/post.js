const router = require('express').Router();
const { checkSchema } = require('express-validator');

const { isAuthenticated, validateRequest } = require('../middlewares/auth');
const postController = require('../controllers/post');
const { postSchema } = require('../services/validators');

// Create post
router.post(
  '/create-post',
  isAuthenticated,
  checkSchema(postSchema),
  validateRequest,
  postController.createPost
);

// Like / Unlike / Repost
router.post('/like', isAuthenticated, postController.likePost);
router.post('/unlike', isAuthenticated, postController.unLikePost);
router.post('/repost', isAuthenticated, postController.repostPost);
router.post('/repost/remove', isAuthenticated, postController.removeRepost);

// Reply to a post
router.post(
  '/reply',
  isAuthenticated,
  checkSchema({
    ...postSchema,
    postId: {
      notEmpty: {
        errorMessage: 'This is a mandatory field',
      },
    },
  }),
  validateRequest,
  postController.postReply
);

// GET routes for fetching posts; campus scoping handled inside controllers
router.get('/:id', isAuthenticated, postController.getPostById);
router.get('/:id/ancestors', isAuthenticated, postController.getAncestorPosts);
router.get('/:id/children', isAuthenticated, postController.getChildPosts);

module.exports = router;
