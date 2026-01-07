import SystemSettings from "../models/systemSettings.model.js";

// Get Settings (Create if default doesn't exist)
export const getSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({});
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Settings
export const updateSettings = async (req, res) => {
    try {
        const { heroDescription, phoneNumber, facebookUrl } = req.body;

        const settings = await SystemSettings.findOneAndUpdate(
            {}, // filter: find the first one
            {
                heroDescription,
                phoneNumber,
                facebookUrl,
            },
            { new: true, upsert: true } // options: return new doc, create if not exists
        );

        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


