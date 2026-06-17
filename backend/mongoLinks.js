const Link = require('./models/link');

// Get all links for a user
async function getLinksForUser(userId) {
  return await Link.find({ userId }).sort({ createdAt: -1 });
}

// Create a new link
async function createLink({ userId, title, url, notes, tags, imageUrl }) {
  return await Link.create({
    userId,
    title,
    url,
    notes: notes || '',
    tags: Array.isArray(tags) ? tags : [],
    imageUrl: imageUrl || '',
  });
}

// Update an existing link
async function updateLink(linkId, userId, { title, url, notes, tags, imageUrl }) {
  return await Link.findOneAndUpdate(
    { _id: linkId, userId },
    {
      title,
      url,
      notes: notes || '',
      tags: Array.isArray(tags) ? tags : [],
      imageUrl: imageUrl || '',
    },
    { new: true }
  );
}

// Delete a link
async function deleteLink(linkId, userId) {
  const result = await Link.deleteOne({ _id: linkId, userId });
  return result.deletedCount > 0;
}

module.exports = {
  getLinksForUser,
  createLink,
  updateLink,
  deleteLink,
};