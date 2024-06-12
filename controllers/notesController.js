const User = require("../models/User");
const Note = require("../models/Note");

const getAllNotes = async (req, res) => {
    const notes = await Note.find().lean();

    // If no notes
    if (!notes?.length) {
        return res.status(400).json({ message: "No notes found" });
    }

    // Add username to each note before sending the response
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE
    // You could also do this with a for...of loop
    const notesWithUser = await Promise.all(
        notes.map(async (note) => {
            const user = await User.findById(note.user).lean().exec();
            return { ...note, username: user.username };
        })
    );

    res.json(notesWithUser);
};

const createNewNote = async (req, res) => {
    const { user, title, text, client } = req.body;

    if (!user || !title || !text || !client) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title })
        .collation({ locale: "en", strength: 2 })
        .lean()
        .exec();

    if (duplicate) {
        return res.status(409).json({ message: "Duplicate note title" });
    }

    // Create and store the new user
    const note = await Note.create({ user, title, text, client });

    if (note) {
        res.status(201).json({ message: `New note ${title} created` });
    } else {
        res.status(400).json({ message: "Invalid note data received" });
    }
};

const updateNote = async (req, res) => {
    const { id, user, title, text, client, completed } = req.body;

    // Confirm data
    if (
        !id ||
        !user ||
        !title ||
        !text ||
        !client ||
        typeof completed !== "boolean"
    ) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Confirm note exists to update
    const note = await Note.findById(id).exec();

    if (!note) {
        return res.status(400).json({ message: "Note not found" });
    }

    const duplicate = await Note.findOne({ title })
        .collation({ locale: "en", strength: 2 })
        .lean()
        .exec();

    // Allow renaming of the original note
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: "Duplicate note title" });
    }

    note.user = user;
    note.title = title;
    note.text = text;
    note.completed = completed;
    note.client = client;

    const updatedNote = await note.save();

    res.json(`'${updatedNote.title}' updated`);
};

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = async (req, res) => {
    const { id } = req.body;

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: "Note ID required" });
    }

    // Confirm note exists to delete
    const note = await Note.findById(id).exec();

    if (!note) {
        return res.status(400).json({ message: "Note not found" });
    }

    const result = await note.deleteOne();

    const reply = `Note '${result.title}' with ID ${result._id} deleted`;

    res.json(reply);
};

module.exports = { getAllNotes, createNewNote, updateNote, deleteNote };
