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
      description:
        'e.g. 33900 for $339.00. For tiered programs, set this to match the lowest tier\'s price (used as the "starting at" price on cards).',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: "pricingTiers",
      title: "Pricing tiers",
      type: "array",
      description:
        "Optional. If set, parents choose one tier on the registration form instead of paying the flat price above.",
      of: [
        {
          type: "object",
          name: "pricingTier",
          validation: (rule) =>
            rule.custom((tier: { sessionsIncluded?: number; weekdayFilter?: string } | undefined) => {
              if (tier?.sessionsIncluded != null && tier?.weekdayFilter) {
                return "Sessions included and Restrict to weekday can't both be set on the same tier — this combination isn't supported yet.";
              }
              return true;
            }),
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              description: 'e.g. "Full Quarter (11 sessions)"',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "price",
              title: "Price (in cents)",
              type: "number",
              description: "e.g. 92900 for $929.00",
              validation: (rule) => rule.required().min(0),
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "string",
              description: "Optional short note, e.g. session count or schedule detail.",
            }),
            defineField({
              name: "sessionsIncluded",
              title: "Sessions included",
              type: "number",
              description:
                "Number of individual sessions this tier covers, e.g. 5 for Half Quarter. Leave blank for full-season coverage — parents won't be asked to pick specific dates.",
              validation: (rule) => rule.min(1),
            }),
            defineField({
              name: "weekdayFilter",
              title: "Restrict to weekday",
              type: "string",
              description:
                'Optional. If set, this tier automatically covers every session on that weekday only (e.g. "Full Quarter (Saturdays)") — no date picking required. Leave blank for tiers covering all days, or use Sessions included instead for a parent-picked subset. Can\'t be combined with Sessions included.',
              options: {
                list: [
                  { title: "Sunday", value: "sunday" },
                  { title: "Monday", value: "monday" },
                  { title: "Tuesday", value: "tuesday" },
                  { title: "Wednesday", value: "wednesday" },
                  { title: "Thursday", value: "thursday" },
                  { title: "Friday", value: "friday" },
                  { title: "Saturday", value: "saturday" },
                ],
              },
            }),
          ],
          preview: {
            select: { title: "label", subtitle: "price" },
          },
        },
      ],
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
