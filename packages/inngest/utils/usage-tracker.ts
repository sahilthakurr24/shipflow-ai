import { Agent, State, StateData, UserMessage } from "@inngest/agent-kit";
import { GetStepTools, Inngest } from "inngest/components/Inngest";


type PayloadType = {
  agent: Agent<StateData>;
  prompt: string | UserMessage;
  state: State<StateData> | undefined;
  step: GetStepTools<Inngest.Any> | undefined;
  maxIter: number;
};
export async function trackAIUsage(payload: PayloadType) {
  const { agent, prompt, state, step, maxIter } = payload;

 const result =  await agent.run(prompt, {
    step,
    state,
    maxIter,
  });
}
