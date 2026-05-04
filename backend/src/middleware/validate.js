const Joi = require('joi');

const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    return res.status(422).json({ success: false, message: 'Validation failed', errors });
  }

  req[source] = value;
  next();
};

const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createProject: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).allow('', null),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#5E6AD2'),
    icon: Joi.string().max(10).default('📋'),
  }),

  updateProject: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().max(500).allow('', null),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
    icon: Joi.string().max(10),
    status: Joi.string().valid('active', 'archived', 'completed'),
  }),

  createTask: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(5000).allow('', null),
    status: Joi.string().valid('todo', 'in_progress', 'in_review', 'done').default('todo'),
    priority: Joi.string().valid('no_priority', 'urgent', 'high', 'medium', 'low').default('no_priority'),
    project: Joi.string().required(),
    assignee: Joi.string().allow(null),
    dueDate: Joi.date().allow(null),
    labels: Joi.array().items(Joi.string().max(30)).max(10),
  }),

  updateTask: Joi.object({
    title: Joi.string().min(1).max(200),
    description: Joi.string().max(5000).allow('', null),
    status: Joi.string().valid('todo', 'in_progress', 'in_review', 'done'),
    priority: Joi.string().valid('no_priority', 'urgent', 'high', 'medium', 'low'),
    assignee: Joi.string().allow(null),
    dueDate: Joi.date().allow(null),
    labels: Joi.array().items(Joi.string().max(30)).max(10),
    order: Joi.number(),
  }),

  addComment: Joi.object({
    content: Joi.string().min(1).max(2000).required(),
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(50),
    avatar: Joi.string().uri().allow(null, ''),
    preferences: Joi.object({
      theme: Joi.string().valid('dark', 'light', 'system'),
      notifications: Joi.boolean(),
      emailDigest: Joi.boolean(),
    }),
  }),
};

module.exports = { validate, schemas };
