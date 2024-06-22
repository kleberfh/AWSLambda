#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { ProductsAppStack } from '../lib/productsApp-stack'
import { EcommerceApiStack } from '../lib/ecommerceApi-stack'
import { ProductsAppLayersStack } from "../lib/productsAppLayers-stack";

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

const productsAppStack = new ProductsAppStack(app, 'ProductsApp', { env, tags })

productsAppStack.addDependency(productsAppLayersStack)

const eCommerceApiStack = new EcommerceApiStack(app, 'ECommerceApi', {
  productsFetchHandler: productsAppStack.ProductsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  env,
  tags
})

eCommerceApiStack.addDependency(productsAppStack)
