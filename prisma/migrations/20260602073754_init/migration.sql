-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blog" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "readTime" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "coverImageAlt" TEXT NOT NULL,
    "lede" TEXT,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "ctaExternal" BOOLEAN NOT NULL DEFAULT false,
    "authorName" TEXT NOT NULL,
    "authorDate" TEXT NOT NULL,
    "carouselIntro" TEXT,
    "carouselBody" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "contentJson" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" BLOB NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Post_blog_status_idx" ON "Post"("blog", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Post_blog_slug_key" ON "Post"("blog", "slug");
