"use server";

import { revalidatePath } from "next/cache";
import Thread from "../models/thread.model";
import User from "../models/user.model";
import { connectDB } from "../mongoose";
import Community from "../models/community.model";

interface Params {
  text: string;
  author: string;
  communityId: string | null;
  path: string;
}

export default async function createThread({
  text,
  author,
  communityId,
  path,
}: Params) {
  try {
    connectDB();

    const communityIdObject = await Community.findOne(
      { id: communityId },
      { _id: 1 }
    );

    const createdThread = await Thread.create({
      text,
      author,
      community: communityIdObject,
    });

    //Update User Model
    await User.findByIdAndUpdate(author, {
      $push: { threads: createdThread._id },
    });

    if (communityIdObject) {
      // Update Community model
      await Community.findByIdAndUpdate(communityIdObject, {
        $push: { threads: createdThread._id },
      });
    }

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to crate/update thread:${error.message}`);
  }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  try {
    connectDB();

    //Calculate page number of  posts to skip
    const skipAmount = (pageNumber - 1) * pageSize;

    //Fetch the posts that have no parents(...top threads)
    const postQuery = Thread.find({ parentId: { $in: [null, undefined] } })
      .sort({
        createdAt: "desc",
      })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({
        path: "author",
        model: User,
      })
      .populate({
        path: "community",
        model: Community,
      })
      .populate({
        path: "children",
        populate: {
          path: "author",
          model: User,
          select: "_id name parentId image",
        },
      });
    const totalPostsCount = await Thread.countDocuments({
      parentId: { $in: [null, undefined] },
    });

    const posts = await postQuery.exec();
    const isNext = totalPostsCount > skipAmount + posts.length;

    return { posts, isNext };
  } catch (error: any) {
    throw new Error(`Failed to crate/update thread:${error.message}`);
  }
}

export async function fetchThreadById(id: string) {
  try {
    connectDB();
    //TODO: populate community
    return await Thread.findById(id)
      .populate({
        path: "author",
        model: User,
        select: "_id id name image",
      })
      .populate({
        path: "community",
        model: Community,
        select: "_id id name image",
      })
      .populate({
        path: "children",
        populate: [
          { path: "author", model: User, select: "_id id name parentId image" },
          {
            path: "children",
            model: Thread,
            populate: {
              path: "author",
              model: User,
              select: "_id id name parentId image",
            },
          },
        ],
      });
  } catch (error: any) {
    throw new Error(`Failed to fetch thread:${error.message}`);
  }
}

export async function addCommentToThread(
  threadId: string,
  commentText: string,
  userId: string,
  path: string
) {
  try {
    connectDB();
    const originalThread = await Thread.findById(threadId);
    if (!originalThread) {
      throw new Error("Thread not found");
    }
    //create new thread with comment text
    const commentThread = new Thread({
      text: commentText,
      author: userId,
      parentId: threadId,
    });

    //save the new thread
    const savedCommentThread = await commentThread.save();
    // Update the original thread to include the new comment

    originalThread.children.push(savedCommentThread._id);
    //save the original thread

    await originalThread.save();
    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to add comment:${error.message}`);
  }
}
