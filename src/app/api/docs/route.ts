import { NextResponse } from "next/server";
import swaggerJSDoc from "swagger-jsdoc";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

const options = {
  definition: {
    openapi: "3.1.1",
    info: {
      title: "Lyon Béton E-commerce API",
      version: "1.0.0",
      description: "API documentation for Lyon Béton e-commerce platform",
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || "http://localhost:3000",
        description: "Current environment",
      },
    ],
  },
  apis: [],
};

export async function GET() {
  try {
    const yamlFile = path.join(process.cwd(), "docs", "openapi.yaml");

    if (fs.existsSync(yamlFile)) {
      const fileContents = fs.readFileSync(yamlFile, "utf8");
      const spec = yaml.load(fileContents) as any;

      if (spec.servers) {
        spec.servers[0].url =
          process.env.NEXTAUTH_URL || "http://localhost:3000";
      }

      return NextResponse.json(spec);
    } else {
      const spec = swaggerJSDoc(options);
      return NextResponse.json(spec);
    }
  } catch (error) {
    console.error("Error generating OpenAPI spec:", error);
    return NextResponse.json(
      { error: "Failed to generate API documentation" },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
