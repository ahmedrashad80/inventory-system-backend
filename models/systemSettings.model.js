import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema(
    {
        heroDescription: {
            type: String,
            default:
                "اكتشف مجموعتنا الواسعة من الأجهزة المنزلية عالية الجودة. من الخلاطات إلى المراوح، نوفر لك كل ما تحتاجه لمنزل عصري ومريح.",
        },
        phoneNumber: {
            type: String,
            default: "+201091144077",
        },
        facebookUrl: {
            type: String,
            default: "https://www.facebook.com/share/1S376BzAbK/",
        },
    },
    { timestamps: true }
);

// We will only have one document, so we can check this at controller level
export default mongoose.model("SystemSettings", systemSettingsSchema);
