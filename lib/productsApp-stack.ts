import DefaultSettings from '../helpers/settings';
import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface ProductsAppStackProps extends cdk.StackProps {
  eventsDdb: dynamodb.Table
}

export class ProductsAppStack extends cdk.Stack {
  readonly ProductsFetchHandler: lambdaNodeJS.NodejsFunction;
  readonly productsAdminHandler: lambdaNodeJS.NodejsFunction;
  readonly productsDdb: dynamodb.Table;

  constructor(scope: Construct, id: string, props: ProductsAppStackProps) {
    super(scope, id, props);

    this.productsDdb = new dynamodb.Table(this, 'ProductsDdb', {
      tableName: 'products',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    })

    // Products Layer
    const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, 'ProductsLayerVersionArn')
    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'ProductsLayerVersionArn', productsLayerArn)

    // Product Events Layer
    const productEventsLayerArn = ssm.StringParameter.valueForStringParameter(this, 'ProductEventsLayerVersionArn')
    const productEventsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'ProductEventsLayerVersionArn', productEventsLayerArn)

    const productEventsHandler = new lambdaNodeJS.NodejsFunction(this, 'ProductsEventsFunction', {
      ...DefaultSettings.defaultNodeRuntimeOptions,
      functionName: 'ProductsEventsFunction',
      entry: 'lambda/products/productEventsFunction.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        EVENTS_DDB: props.eventsDdb.tableName,
      },
      layers: [productEventsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
    })

    props.eventsDdb.grantWriteData(productEventsHandler)

    this.ProductsFetchHandler = new lambdaNodeJS.NodejsFunction(this, 'ProductsFetchFunction', {
      ...DefaultSettings.defaultNodeRuntimeOptions,
      functionName: 'ProductsFetchFunction',
      entry: 'lambda/products/productsFetchFunction.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        PRODUCTS_DDB: this.productsDdb.tableName,
      },
      layers: [productsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
    })

    this.productsDdb.grantReadData(this.ProductsFetchHandler)

    this.productsAdminHandler = new lambdaNodeJS.NodejsFunction(this, 'ProductsAdminFunction', {
      ...DefaultSettings.defaultNodeRuntimeOptions,
      functionName: 'ProductsAdminFunction',
      entry: 'lambda/products/productsAdminFunction.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        PRODUCTS_DDB: this.productsDdb.tableName,
        PRODUCTS_EVENTS_FUNCTION_NAME: productEventsHandler.functionName
      },
      layers: [productsLayer, productEventsLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
    })

    this.productsDdb.grantReadWriteData(this.productsAdminHandler)

    productEventsHandler.grantInvoke(this.productsAdminHandler)
  }
}
