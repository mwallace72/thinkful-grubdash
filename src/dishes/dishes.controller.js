const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
let lastdishId = dishes.reduce((maxId, use) => Math.max(maxId, use.id), 0)

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
    // const { orderId } = req.params;
    // res.json({ data: dishes.filter(orderId ? dish => dish.orderId == orderId : () => true) });
    res.json({ data: dishes });
}

function findDish(dishId) {
    // console.log(dishes)
    return dishes.find((dish) => dish.id === dishId);
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Must include a ${propertyName}` });
    };
}

function propIsNotEmpty(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName] != "") {
          return next();
        }
        next({ status: 400, message: `${propertyName} must not be empty` });
      };
}

function priceIsWellFormed() {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (typeof data.price === 'number' && data.price > 0) {
          return next();
        }
        next({ status: 400, message: `price must be well formed` });
      };
}

function idMismatch() {
    return function (req, res, next) {
        const { dishId } = req.params;
        const { data = {} } = req.body;
        // Not required in body
        if (data.id === dishId || data.id === undefined || data.id === null || data.id === '') {
          return next();
        }
        next({ status: 400, message: `Dish id does not match route id. Dish: ${data.id}, Route: ${dishId}` });
      };
}

function create(req, res) {
    const { data: { name, image_url, description, price } = {} } = req.body;
    const newDish = {
      id: ++lastdishId, // Increment last id then assign as the current ID
      name, image_url, description, price,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = findDish(dishId);
    if (foundDish) {
        res.locals.dish = foundDish
      return next();
    }
    next({
      status: 404,
      message: `dish id not found: ${dishId}`,
    });
}

function read(req, res) {
    const foundDish = res.locals.dish;
    res.json({ data: foundDish });
}

function update(req, res) {
    const foundDish = res.locals.dish;
    const { data: { name, image_url, description, price } = {} } = req.body;
  
    // Update the dish
    foundDish.name = name;
    foundDish.image_url = image_url
    foundDish.description = description
    foundDish.price = price
  
    res.json({ data: foundDish });
}

module.exports = {
    list,
    create: [
        bodyDataHas("name"), 
        bodyDataHas("description"), 
        bodyDataHas("price"), 
        bodyDataHas("image_url"), 
        propIsNotEmpty("name"),
        propIsNotEmpty("description"),
        propIsNotEmpty("image_url"),
        priceIsWellFormed(),
        create
    ], 
    read: [dishExists, read], 
    update: [
        bodyDataHas("name"), 
        bodyDataHas("description"), 
        bodyDataHas("price"), 
        dishExists, 
        bodyDataHas("image_url"), 
        propIsNotEmpty("name"),
        propIsNotEmpty("description"),
        propIsNotEmpty("image_url"),
        priceIsWellFormed(), 
        idMismatch(),
       
        update
    ]
};