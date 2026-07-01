import { inngest } from "../client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world", triggers: [{ event: "test/hello.world" }] },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  },
);


export default inngest.createFunction(
  { id: "summarize-contents", triggers: { event: "app/ticket.created" } },
  async ({ event, step }) => {

    // This calls your model's chat endpoint, adding AI observability,
    // metrics, datasets, and monitoring to your calls.
    const response = await step.ai.infer("call-openai", {
      model: step.ai.models.openai({ model: "gpt-4o" }),
      // body is the model request, which is strongly typed depending on the model
      body: {
        messages: [{
          role: "assistant",
          content: "Write instructions for improving short term memory",
        }],
      },
    });

    // The response is also strongly typed depending on the model.
    return response.choices;

    response.usage
  }
);