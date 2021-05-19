const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function create(req, res, next) {
  const { data: order = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo: order.deliverTo,
    mobileNumber: order.mobileNumber,
    status: order.status,
    dishes: order.dishes,
  };
  //add to orders list
  orders.push(newOrder);

  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  const order = res.locals.order;
  res.json({ data: order });
}

function update(req, res, next) {
  const { data: order = {} } = req.body;
  const existingOrder = res.locals.order;

  const updatedOrder = {
    id: existingOrder.id,
    deliverTo: order.deliverTo,
    mobileNumber: order.mobileNumber,
    status: order.status,
    dishes: order.dishes,
  };

  res.json({ data: updatedOrder });
}

function destroy(req, res, next) {
  const orderToDelete = res.locals.order;

  const index = orders.findIndex((order) => order.id === orderToDelete.id);
  orders.splice(index, 1);

  res.sendStatus(204);
}

function list(req, res) {
  res.json({ data: orders });
}

function orderIsPending(req, res, next) {
  const order = res.locals.order;

  if (order.status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}

function newOrderIsValid(req, res, next) {
  const { data: order = {} } = req.body;

  if (!order.deliverTo) {
    next({ status: 400, message: "Order must include a deliverTo" });
  }
  if (!order.mobileNumber) {
    next({ status: 400, message: "Order must include a mobileNumber" });
  }
  if (!order.dishes) {
    next({ status: 400, message: "Order must include a dish" });
  }
  if (!Array.isArray(order.dishes)) {
    next({ status: 400, message: "Order must include at least one dish" });
  }
  if (
    !Array.isArray(order.dishes) ||
    (Array.isArray(order.dishes) && order.dishes.length === 0)
  ) {
    next({ status: 400, message: "Order must include at least one dish" });
  }

  return next();
}

function orderDishesIsValid(req, res, next) {
  const { data: order = {} } = req.body;
  const dishes = order.dishes;

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    ) {
      next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  return next();
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const { data: order = {} } = req.body;

  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order id does not exist: ${orderId}` });
}

function orderStatusIsValid(req, res, next) {
  const { data: order } = req.body;
  const existingOrder = res.locals.order;

  if (!order.status || order.status === "invalid") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }
  if (existingOrder.status === "delivered") {
    next({ status: 400, message: "A delivered order cannot be changed" });
  }

  return next();
}

function bodyIdPropertyMatchesRouteId(req, res, next) {
  const orderId = req.params.orderId;
  const { data: order = {} } = req.body;
  if (order.id === orderId || !order.id) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${order.id}, Route: ${orderId}`,
  });
}

module.exports = {
  list,
  create: [newOrderIsValid, orderDishesIsValid, create],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyIdPropertyMatchesRouteId,
    newOrderIsValid,
    orderDishesIsValid,
    orderStatusIsValid,
    update,
  ],
  delete: [orderExists, orderIsPending, destroy],
};
