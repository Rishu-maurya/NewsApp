const slugify = require("./slugify")
const Article = require("../models/article")

const generateUniqueSlug = async (title) => {
    const baseSlug = slugify(title)
    if (!baseSlug) return null

    let slug = baseSlug
    let counter = 1

    while (await Article.exists({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++ ;
    }
    return slug
}

module.exports = generateUniqueSlug