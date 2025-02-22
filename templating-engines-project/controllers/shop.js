const fs = require("fs");
const path = require("path");

const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const Order = require("../models/order");
const product = require("../models/product");
const stripe = require("stripe")(process.env.STRIPE_KEY);
const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  product
    .countDocuments()
    .then((numOfDocuments) => {
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .then((products) => {
          res.render("shop/product-list", {
            prods: products,
            pageTitle: "All Products",
            path: "/products",
            totalProducts: numOfDocuments,
            hasNextPage: ITEMS_PER_PAGE * page < numOfDocuments,
            hasPrevPage: page > 1,
            prevPage: page - 1,
            currentPage: page,
            nextPage: page + 1,
            lastPage: Math.ceil(numOfDocuments / ITEMS_PER_PAGE),
          });
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  Product.countDocuments()
    .then((numOfDocuments) => {
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .then((products) => {
          res.render("shop/index", {
            prods: products,
            pageTitle: "Shop",
            path: "/",
            totalProducts: numOfDocuments,
            hasNextPage: ITEMS_PER_PAGE * page < numOfDocuments,
            hasPrevPage: page > 1,
            prevPage: page - 1,
            currentPage: page,
            nextPage: page + 1,
            lastPage: Math.ceil(numOfDocuments / ITEMS_PER_PAGE),
          });
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.productId")
    /** NO execPopulate method -- removed */
    .then((user) => {
      const products = user.cart.filter((cp) => cp.productId);
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  console.log("here");
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      console.log(req.user, product);
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log("database");
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(() => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.productId")
    /** NO execPopulate method -- removed */
    .then((user) => {
      const products = user.cart
        .filter((cp) => cp.productId)
        .map((i) => {
          return {
            quantity: i.quantity,
            product: { ...i.productId._doc },
          };
        });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then((result) => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No order found."));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + invoiceName + '"'
      );
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text("Invoice", { underline: true });

      pdfDoc.text("-------------------------");
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              " - " +
              prod.quantity +
              " x " +
              "$" +
              prod.product.price
          );
      });
      pdfDoc.text("---");
      pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);

      pdfDoc.end();
      // fs.readFile(invoicePath, (err, data) => {
      //     if (err) {
      //         console.log(err);
      //         return next(err);
      //     }

      //     res.setHeader('Content-Type', 'application/pdf');
      //     res.setHeader(
      //         'Content-Disposition',
      //         'inline; filename="' + invoiceName + '"'
      //     );
      //     res.send(data);
      // });
      // const file = fs.createReadStream(invoicePath);

      // file.pipe(res);
    })
    .catch((err) => next(err));
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total;

  req.user
    .populate("cart.productId")
    // .execPopulate()
    .then((user) => {
      products = user.cart.filter((cp) => cp.productId);
      total = products.reduce(
        (acc, cp) => acc + cp.quantity * cp.productId.price,
        0
      );
      return stripe.checkout.session.create({
        payment_method_types: ["card"],
        line_items: products.map((cp) => {
          return {
            name: cp.productId.title,
            description: cp.productId.description,
            // to be converted to cent
            amount: cp.productId.price * 100,
            quantity: cp.quantity,
            currency: "usd",
          };
        }),
        success_url: "/checkout/success",
        cancel_url: "/checkout/cancel",
      });
    })
    .then((session) =>
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitleitle: "Checkout",
        products: products,
        totalSum: total,
        sessionId: session.id,
      })
    )
    .catch((err) => {
      next(new Error(err));
    });
};
