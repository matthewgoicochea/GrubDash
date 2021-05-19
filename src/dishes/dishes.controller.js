//const path = require("path");

// Use the existing dishes data
const dishes = require("../data/dishes-data");

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res, next) {
  const { data: dish = {} } = req.body;

  const newDish = {
    id: nextId(),
    name: dish.name,
    description: dish.description,
    price: dish.price,
    image_url: dish.image_url,
  };
  //add to dishes
  dishes.push(newDish);

  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  const dish = res.locals.dish;

  res.json({ data: dish });
}

function update(req, res, next) {
  const dishId = req.params.dishId;
  const existingDish = res.locals.dish;

  const { data: dish = {} } = req.body;
  dish.id = existingDish.id;

  //update dishes data
  const index = dishes.findIndex((dish) => dish.id === dishId);
  dishes.splice(index, 1, dish);

  res.json({ data: dish });
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish does not exist: ${dishId}` });
}

function bodyIsValid(req, res, next) {
  const { data: dish = {} } = req.body;
  if (dish.name === undefined || !dish.name) {
    next({ status: 400, message: "Dish must include a name" });
  }
  if (dish.description === undefined || !dish.description) {
    next({ status: 400, message: "Dish must include a description" });
  }
  if (!dish.price) {
    next({ status: 400, message: "Dish must include a price" });
  }
  if (dish.price <= 0 || typeof dish.price !== "number") {
    next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
  if (dish.image_url === undefined || !dish.image_url) {
    next({ status: 400, message: "Dish must include a image_url" });
  }

  next();
}

function priceIsANumber(req, res, next) {
  const { data: dish = {} } = req.body;
  if (typeof dish.price == "number") {
    return next();
  }
  next({
    status: 400,
    message: `Dish price must be an integer: ${dish.price}`,
  });
}

function bodyIdMatchesRouteId(req, res, next) {
  const { data: dish = {} } = req.body;

  if (dish.id) {
    const dishId = req.params.dishId;
    if (dish.id !== dishId) {
      next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${dish.id}, Route: ${dishId}`,
      });
    }
  }
  return next();
}

module.exports = {
  list,
  create: [bodyIsValid, create],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyIdMatchesRouteId,
    bodyIsValid,
    priceIsANumber,
    update,
  ],
};
