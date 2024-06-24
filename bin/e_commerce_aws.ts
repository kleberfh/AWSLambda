#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { OrderAppStack } from '../lib/ordersApp-stack'
import { EventsDdbStack } from "../lib/eventsDdb-Stack"
import { ProductsAppStack } from '../lib/productsApp-stack'
import { EcommerceApiStack } from '../lib/ecommerceApi-stack'
import { OrdersAppLayersStack } from '../lib/ordersAppLayers-stack'
import { ProductsAppLayersStack } from "../lib/productsAppLayers-stack"

const app = new cdk.App()

const env: cdk.Environment = {
  account: "339713040399",
  region: "us-east-1"
}

const tags = {
  cost: "ECommerce",
  team: "KleberFh",
}

const productsAppLayersStack = new ProductsAppLayersStack(app, 'ProductsAppLayers', { env, tags })

const eventsDdbStack = new EventsDdbStack(app, 'EventsDdb', { env, tags })
const productsAppStack = new ProductsAppStack(app, 'ProductsApp', { env, tags, eventsDdb: eventsDdbStack.table })

productsAppStack.addDependency(productsAppLayersStack)
productsAppStack.addDependency(eventsDdbStack)

const ordersAppLayerStack = new OrdersAppLayersStack(app, 'OrdersAppLayers', {
  tags,
  env
})

const ordersAppStack = new OrderAppStack(app, 'OrdersApp', {
  tags,
  env,
  productDdb: productsAppStack.productsDdb
})

ordersAppStack.addDependency(productsAppStack)
ordersAppStack.addDependency(ordersAppLayerStack)

const eCommerceApiStack = new EcommerceApiStack(app, 'ECommerceApi', {
  productsFetchHandler: productsAppStack.ProductsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  ordersHandler: ordersAppStack.ordersHandler,
  env,
  tags
})

eCommerceApiStack.addDependency(productsAppStack)
eCommerceApiStack.addDependency(ordersAppStack)
