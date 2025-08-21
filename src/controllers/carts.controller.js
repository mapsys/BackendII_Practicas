// src/controllers/carts.controller.js
import CartService from "../services/cart.service.js";

export default class CartsController {
  constructor(service = new CartService()) {
    this.service = service;

    this.list = this.list.bind(this);
    this.getOne = this.getOne.bind(this);
    this.create = this.create.bind(this);
    this.addProduct = this.addProduct.bind(this);
    this.replaceProducts = this.replaceProducts.bind(this);
    this.updateQuantity = this.updateQuantity.bind(this);
    this.removeProduct = this.removeProduct.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.totals = this.totals.bind(this);
    this.clear = this.clear.bind(this);
  }

  async list(req, res, next) {
    try {
      const carts = await this.service.list();
      res.json({ status: "success", payload: carts });
    } catch (e) { next(e); }
  }

  async getOne(req, res, next) {
    try {
      const cart = await this.service.getById(req.params.cid, { populate: true });
      res.json(cart);
    } catch (e) { next(e); }
  }

  async create(_req, res, next) {
    try {
      const cart = await this.service.create();
      res.status(201).json(cart);
    } catch (e) { next(e); }
  }

  async addProduct(req, res, next) {
    try {
      const { qty = 1 } = req.body; // o query, como prefieras
      const cart = await this.service.addProduct(req.params.cid, req.params.pid, Number(qty));
      res.status(200).json(cart);
    } catch (e) { next(e); }
  }

  async replaceProducts(req, res, next) {
    try {
      const { products } = req.body; // [{product, quantity}]
      const cart = await this.service.replaceProducts(req.params.cid, products);
      res.status(200).json(cart);
    } catch (e) { next(e); }
  }

  async updateQuantity(req, res, next) {
    try {
      const { quantity } = req.body; // number
      const cart = await this.service.updateQuantity(req.params.cid, req.params.pid, Number(quantity));
      res.status(200).json(cart);
    } catch (e) { next(e); }
  }

  async removeProduct(req, res, next) {
    try {
      const cart = await this.service.removeProduct(req.params.cid, req.params.pid);
      res.status(200).json(cart);
    } catch (e) { next(e); }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const cart = await this.service.updateStatus(req.params.cid, status);
      res.status(200).json(cart);
    } catch (e) { next(e); }
  }

  async totals(req, res, next) {
    try {
      const totals = await this.service.totals(req.params.cid);
      res.status(200).json(totals);
    } catch (e) { next(e); }
  }

    async clear(req, res, next) {
    try {
      console.log('Vaciare cart ', req.params.cid);
      const cart = await this.service.clear(req.params.cid);
      console.log('vacie el carrito)', cart);
      res.status(200).json(cart);
    } catch (e) { next(e); }
  }
}
