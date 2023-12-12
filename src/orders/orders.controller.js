const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
let lastorderId = orders.reduce((maxId, use) => Math.max(maxId, use.id), 0)

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
    res.json({ data: orders });
}

function findOrder(orderId) {
    // console.log(orders, orderId)
    return orders.find((order) => order.id === orderId);
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

function dishesIsWellFormed() {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (Array.isArray(data.dishes) && data.dishes.length > 0) {
          data.dishes.every((dish, index) => {
            if (typeof dish.quantity === 'number' && dish.quantity > 0) return true
            return next({status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0`})
          })
          return next();
        } else {
            next({ status: 400, message: `dishes must be well formed` });
        }
      };
}

function statusIsWellFormed() {
    return function(req, res, next) {
        const { data = {} } = req.body;
        if (['pending', 'preparing', 'out-for-delivery', 'delivered'].includes(data.status)) {
          return next();
        }
        next({ status: 400, message: `status must be know status` });
    }
}

function statusNot(notStatus) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data.status !== notStatus) {
          return next();
        }
        next({ status: 400, message: `status must not be ${notStatus}` });
      };
}

function statusIs(desiredStatus) {
    return function (req, res, next) {
        const foundOrder = res.locals.order;
        if (foundOrder.status === desiredStatus) {
            res.locals.order = foundOrder
            return next();
        }
        next({status: 400, message: `status must be ${desiredStatus}`});
    };
}

function idMismatch() {
    return function (req, res, next) {
        const { orderId } = req.params;
        const { data = {} } = req.body;
        // Not required in body
        if (data.id === orderId || data.id === undefined || data.id === null || data.id === '') {
          return next();
        }
        next({ status: 400, message: `Order id does not match route id. Order: ${data.id}, Route: ${orderId}` });
      };
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const newOrder = {
      id: ++lastorderId, // Increment last id then assign as the current ID
      deliverTo, mobileNumber, dishes,
      status: 'pending'
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = findOrder(orderId);
    if (foundOrder) {
      res.locals.order = foundOrder
      return next();
    }
    next({
      status: 404,
      message: `order id not found: ${orderId}`,
    });
}

function read(req, res) {
    const foundOrder = res.locals.order;
    res.json({ data: foundOrder });
}

function update(req, res) {
    const foundOrder = res.locals.order;
    const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
  
    // Update the order
    foundOrder.deliverTo = deliverTo;
    foundOrder.mobileNumber = mobileNumber
    foundOrder.dishes = dishes
    foundOrder.status = status
  
    res.json({ data: foundOrder });
}

function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === Number(orderId));
    // `splice()` returns an array of the deleted elements, even if it is one element
    orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [
        bodyDataHas("deliverTo"), 
        bodyDataHas("mobileNumber"), 
        bodyDataHas("dishes"), 
        propIsNotEmpty("deliverTo"),
        propIsNotEmpty("mobileNumber"),
        dishesIsWellFormed(),
        create
    ], 
    read: [orderExists, read], 
    update: [
        orderExists, 
        bodyDataHas("deliverTo"), 
        bodyDataHas("mobileNumber"), 
        bodyDataHas("dishes"), 
        bodyDataHas("status"), 
        propIsNotEmpty("deliverTo"),
        propIsNotEmpty("mobileNumber"),
        propIsNotEmpty("status"),
        dishesIsWellFormed(),
        statusIsWellFormed(),
        statusNot("delivered"),
        idMismatch(),
        
        update
    ],
    delete: [
        orderExists, 
        statusIs("pending"), 
        destroy
    ]
};
