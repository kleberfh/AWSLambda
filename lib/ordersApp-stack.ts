import * as cdk from 'aws-cdk-lib'
import {Construct} from 'constructs'
import * as ssm from "aws-cdk-lib/aws-ssm"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as dynamoDB from 'aws-cdk-lib/aws-dynamodb'
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs"
import DefaultSettings from "../helpers/settings";

interface OrdersAppStackProps extends cdk.StackProps {
  productDdb: dynamoDB.Table
}

export class OrderAppStack extends cdk.Stack {
  readonly ordersHandler: lambdaNodeJS.NodejsFunction

  constructor(scope: Construct, id: string, props: OrdersAppStackProps) {
    super(scope, id, props)

    const ordersDdb = new dynamoDB.Table(this, 'OrdersDdb', {
      tableName: 'orders',
      partitionKey: {
        name: 'pk',
        type: dynamoDB.AttributeType.STRING
      },
      sortKey: {
        name: 'sk',
        type: dynamoDB.AttributeType.STRING
      },
      billingMode: dynamoDB.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    })

    //Orders Layer
    const ordersLayerArn = ssm.StringParameter.valueForStringParameter(this, 'OrdersLayerVersionArn')
    const ordersLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'OrdersLayerVersionArn', ordersLayerArn)

    //Orders Api Layer
    const ordersApiLayerArn = ssm.StringParameter.valueForStringParameter(this, 'OrdersApiLayerVersionArn')
    const ordersApiLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'OrdersApiLayerVersionArn', ordersApiLayerArn)

    //Products Layer
    const productsLayerArn = ssm.StringParameter.valueForStringParameter(this, 'ProductsLayerVersionArn')
    const productsLayer = lambda.LayerVersion.fromLayerVersionArn(this, 'ProductsLayerVersionArn', productsLayerArn)

    this.ordersHandler = new lambdaNodeJS.NodejsFunction(this, 'OrdersFunction', {
      ...DefaultSettings.defaultNodeRuntimeOptions,
      functionName: 'OrdersFunction',
      entry: 'lambda/orders/ordersFunction.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: false,
      },
      environment: {
        PRODUCTS_DDB: props.productDdb.tableName,
        ORDERS_DDB: ordersDdb.tableName,
      },
      layers: [ordersLayer, productsLayer, ordersApiLayer],
      tracing: lambda.Tracing.ACTIVE,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_229_0,
    })

    ordersDdb.grantReadWriteData(this.ordersHandler)
    props.productDdb.grantReadData(this.ordersHandler)
  }
}
