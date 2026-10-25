const Category = require("../models/Category")
const slugify = require("../utils/slugify")
const mongoose = require("mongoose");
const Article = require("../models/Article.js");

const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            })
        }

        const slug = slugify(name);
        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Category name must contain letters or numbers",
            });
        }

        const exists = await Category.findOne({ slug });
        if (exists) {
            return res.status(400).json({
                success: false,
                message: "Category already exists",
            });
        }

        const category = await Category.create({
            name: name.trim(),
            slug,
            description,
        });

        res.status(201).json({
            success: true,
            message: "Category created",
            data: category,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Category already exists",
            });
        }
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }
        console.error("Create Category Error:", error);
        res.status(500).json({ success: false, message: "Server error" });

    }
}

const getCategories = async (req, res) => {
    try{
        const categories = await Category.find({ isActive: true })
        .select("name slug description image")
        .sort({ name : 1 })

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        })
    } catch(error) {
        console.error("Get Categories Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}


const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category id",
            });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const { name, description, isActive } = req.body;

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Category name cannot be empty",
                });
            }

            const slug = slugify(name);
            if (!slug) {
                return res.status(400).json({
                    success: false,
                    message: "Category name must contain letters or numbers",
                });
            }

            const duplicate = await Category.findOne({ slug, _id: { $ne: id } });
            if (duplicate) {
                return res.status(400).json({
                    success: false,
                    message: "Category already exists",
                });
            }

            category.name = name.trim();
            category.slug = slug;
        }

        if (description !== undefined) {
            category.description = description;
        }

        if (isActive !== undefined) {
            if (typeof isActive !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "isActive must be true or false",
                });
            }
            category.isActive = isActive;
        }

        await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated",
            data: category,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Category already exists",
            });
        }
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }
        console.error("Update Category Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category id",
            });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const articleCount = await Article.countDocuments({ category: id });
        if (articleCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete. ${articleCount} article(s) use this category. Set isActive to false instead.`,
            });
        }

        await category.deleteOne();

        res.status(200).json({
            success: true,
            message: "Category deleted",
        });
    } catch (error) {
        console.error("Delete Category Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };