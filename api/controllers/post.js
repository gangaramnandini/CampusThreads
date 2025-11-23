const createError = require('http-errors');
const prisma = require('../services/connect-db');
const {
  NOTIFICATION_OBJECT_TYPE,
  NOTIFICATION_TYPE,
} = require('../utils/enums');

// Helper: safely get organizationId / departmentId from req.user
const getOrgAndDeptFromReq = (req) => {
  const user = req.user || {};
  return {
    organizationId: user.organizationId || null,
    departmentId: user.departmentId || null,
  };
};

const createPost = async (req, res, next) => {
  const { content } = req.body;
  const user = req.user;
  const { organizationId, departmentId } = getOrgAndDeptFromReq(req);

  try {
    if (!user) {
      throw createError.Unauthorized();
    }

    if (!content || !content.trim()) {
      throw createError.BadRequest('Content cannot be empty');
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        user: { connect: { id: user.id } },
        organization: organizationId ? { connect: { id: organizationId } } : undefined,
        department: departmentId ? { connect: { id: departmentId } } : undefined,
      },
      include: {
        user: { select: { username: true } },
      },
    });

    return res.status(201).json({ post });
  } catch (error) {
    return next(error);
  }
};

const likePost = async (req, res, next) => {
  const { postId } = req.body;
  const user = req.user;

  try {
    if (!user) {
      throw createError.Unauthorized();
    }

    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
    });

    if (!post || post.organizationId !== user.organizationId) {
      throw createError.NotFound();
    }

    const alreadyLiked = await prisma.like.findFirst({
      where: { postId: Number(postId), userId: user.id },
    });
    if (alreadyLiked) return res.status(201).json({ message: 'success' });

    const likedPost = await prisma.like.create({
      data: {
        post: { connect: { id: Number(postId) } },
        user: { connect: { id: user.id } },
      },
      include: { post: true },
    });

    await prisma.notification.create({
      data: {
        senderId: user.id,
        recipientId: post.userId,
        type: NOTIFICATION_TYPE.LIKE,
        objectType: NOTIFICATION_OBJECT_TYPE.POST,
        objectURI: post.id,
      },
    });

    return res.status(201).json({ post: likedPost });
  } catch (error) {
    return next(error);
  }
};

const unLikePost = async (req, res, next) => {
  const { postId } = req.body;
  const user = req.user;

  try {
    if (!user) {
      throw createError.Unauthorized();
    }

    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
    });

    if (!post || post.organizationId !== user.organizationId) {
      throw createError.NotFound();
    }

    await prisma.like.delete({
      where: {
        postId_userId: {
          postId: Number(postId),
          userId: Number(user.id),
        },
      },
    });

    return res.status(200).json({ message: 'success' });
  } catch (error) {
    return next(error);
  }
};

const repostPost = async (req, res, next) => {
  const { postId } = req.body;
  const user = req.user;

  try {
    if (!user) {
      throw createError.Unauthorized();
    }

    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
    });

    if (!post || post.organizationId !== user.organizationId) {
      throw createError.NotFound();
    }

    const repost = await prisma.repost.create({
      data: {
        post: { connect: { id: Number(postId) } },
        user: { connect: { id: user.id } },
      },
      include: { post: true },
    });

    await prisma.notification.create({
      data: {
        senderId: user.id,
        recipientId: post.userId,
        type: NOTIFICATION_TYPE.REPOST,
        objectType: NOTIFICATION_OBJECT_TYPE.POST,
        objectURI: post.id,
      },
    });

    return res.status(201).json({ post: repost });
  } catch (error) {
    return next(error);
  }
};

const removeRepost = async (req, res, next) => {
  const { postId } = req.body;
  const user = req.user;

  try {
    if (!user) {
      throw createError.Unauthorized();
    }

    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
    });

    if (!post || post.organizationId !== user.organizationId) {
      throw createError.NotFound();
    }

    await prisma.repost.delete({
      where: {
        postId_userId: {
          postId: Number(postId),
          userId: Number(user.id),
        },
      },
    });

    return res.status(200).json({ message: 'success' });
  } catch (error) {
    return next(error);
  }
};

const postReply = async (req, res, next) => {
  const { postId, content } = req.body;
  const user = req.user;
  const { organizationId, departmentId } = getOrgAndDeptFromReq(req);

  try {
    if (!user) {
      throw createError.Unauthorized();
    }

    if (!content || !content.trim()) {
      throw createError.BadRequest('Content cannot be empty');
    }

    const parentPost = await prisma.post.findUnique({
      where: { id: Number(postId) },
    });

    if (!parentPost || parentPost.organizationId !== user.organizationId) {
      throw createError.NotFound();
    }

    const reply = await prisma.post.create({
      data: {
        content: content.trim(),
        user: { connect: { id: user.id } },
        parentPost: { connect: { id: Number(postId) } },
        organization: organizationId ? { connect: { id: organizationId } } : undefined,
        department: departmentId ? { connect: { id: departmentId } } : undefined,
      },
      include: {
        parentPost: { select: { userId: true } },
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { name: true, img: true } },
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        senderId: user.id,
        recipientId: parentPost.userId,
        type: NOTIFICATION_TYPE.REPLY,
        objectType: NOTIFICATION_OBJECT_TYPE.POST,
        objectURI: parentPost.id,
      },
    });

    return res.status(201).json({ post: reply });
  } catch (error) {
    return next(error);
  }
};

const getPostById = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  try {
    if (!user) {
      throw createError.Unauthorized();
    }

    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
      include: {
        parentPost: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: { select: { name: true, img: true } },
              },
            },
          },
        },
        reposts: true,
        replies: true,
        likes: true,
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { name: true, img: true } },
          },
        },
      },
    });

    if (!post || post.organizationId !== user.organizationId) {
      throw createError.NotFound();
    }

    return res.status(200).json(post);
  } catch (error) {
    return next(error);
  }
};

const getAncestorPosts = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  try {
    if (!user) {
      throw createError.Unauthorized();
    }

    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
    });

    if (!post || post.organizationId !== user.organizationId) {
      throw createError.NotFound();
    }

    let { parentPostId } = post;
    if (!parentPostId) {
      return res.status(200).json(null);
    }

    const posts = {};
    let HEAD = posts;

    while (parentPostId) {
      const parentPost = await prisma.post.findUnique({
        where: { id: parentPostId },
        include: {
          parentPost: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profile: { select: { name: true, img: true } },
                },
              },
            },
          },
          reposts: true,
          replies: true,
          likes: true,
          user: {
            select: {
              id: true,
              username: true,
              profile: { select: { name: true, img: true } },
            },
          },
        },
      });

      if (!parentPost || parentPost.organizationId !== user.organizationId) {
        break;
      }

      HEAD.post = parentPost;
      parentPostId = parentPost.parentPostId;

      if (parentPostId) {
        HEAD.next = {};
        HEAD = HEAD.next;
      } else {
        HEAD.next = null;
      }
    }

    return res.status(200).json(posts);
  } catch (error) {
    return next(error);
  }
};

const getChildPosts = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  try {
    if (!user) {
      throw createError.Unauthorized();
    }

    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
    });

    if (!post || post.organizationId !== user.organizationId) {
      throw createError.NotFound();
    }

    const posts = await prisma.post.findMany({
      where: {
        parentPostId: post.id,
        organizationId: user.organizationId,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        parentPost: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: { select: { name: true, img: true } },
              },
            },
          },
        },
        reposts: true,
        replies: true,
        likes: true,
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { name: true, img: true } },
          },
        },
      },
    });

    return res.status(200).json(posts);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPost,
  likePost,
  unLikePost,
  repostPost,
  removeRepost,
  postReply,
  getPostById,
  getAncestorPosts,
  getChildPosts,
};
