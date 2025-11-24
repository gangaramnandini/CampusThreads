const prisma = require('../services/connect-db');

const getUserHomeFeed = async (req, res, next) => {
  const { userId } = req;
  const page = Number(req.query.page) || 1;
  const limit = 10;

  try {
    // Fetch authenticated user's organization_id
    const authUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { organization_id: true },
    });
    if (!authUser) {
      throw new Error('User not found');
    }

    // Count posts from followed users in the same organization
    const postCount = await prisma.post.count({
      where: {
        parentPostId: null,
        user: {
          followedBy: {
            some: { id: userId },
          },
          organization_id: authUser.organization_id,
        },
      },
    });

    const repostCount = await prisma.repost.count({
      where: {
        user: {
          followedBy: {
            some: { id: userId },
          },
          organization_id: authUser.organization_id,
        },
      },
    });

    const total = postCount + repostCount;

    const posts = await prisma.post.findMany({
      where: {
        parentPostId: null,
        user: {
          followedBy: {
            some: { id: userId },
          },
          organization_id: authUser.organization_id,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { name: true, img: true } },
          },
        },
        replies: true,
        reposts: true,
        likes: true,
      },
    });

    const reposts = await prisma.repost.findMany({
      where: {
        user: {
          followedBy: {
            some: { id: userId },
          },
          organization_id: authUser.organization_id,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { name: true, img: true } },
          },
        },
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: { select: { name: true, img: true } },
              },
            },
            replies: true,
            reposts: true,
            likes: true,
          },
        },
      },
    });

    const combinedPosts = [...posts, ...reposts].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const slicedPosts = combinedPosts.slice(startIndex, endIndex);

    return res.status(200).json({
      info: {
        total,
        nextPage: endIndex < combinedPosts.length ? page + 1 : null,
        prevPage: page === 1 ? null : page - 1,
      },
      results: slicedPosts,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getUserHomeFeed,
};
