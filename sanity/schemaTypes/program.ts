import { defineField, defineType } from "sanity";

export const program = defineType({
  name: "program",
  title: "Program",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      description: "Short description shown on program cards and lists.",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "startDate",
      title: "Start date",
      type: "date",
      description: "Leave blank if dates are TBD.",
    }),
    defineField({
      name: "endDate",
      title: "End date",
      type: "date",
      description: "Leave blank if dates are TBD.",
    }),
    defineField({
      name: "price",
      title: "Price (in cents)",
      type: "number",
      description: "e.g. 33900 for $339.00",
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: "capacity",
      title: "Capacity",
      type: "number",
    }),
    defineField({
      name: "ageGroup",
      title: "Age group",
      type: "string",
      description: 'e.g. "7-15"',
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      description: "Hide past or closed sessions from the public site.",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "ageGroup",
      media: "heroImage",
    },
  },
});
