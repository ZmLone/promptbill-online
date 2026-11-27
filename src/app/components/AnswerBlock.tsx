import { JsonLd } from './JsonLd';
import { buildCompareSchema, buildModelSchema, type SchemaModelInput } from '../lib/seoSchemas';

interface ModelAnswerBlockProps {
  model: SchemaModelInput & {
    benchmarkStatus?: string | null;
    pricingStatus?: string | null;
    routerSummary?: string | null;
    medianInputPer1M?: number | null;
    medianOutputPer1M?: number | null;
    lastVerified?: string | null;
  };
}

function fmtUsd(val: number | null | undefined): string {
  return typeof val === 'number' && Number.isFinite(val) ? `$${val.toFixed(2)}` : 'N/A';
}

export function ModelAnswerBlock({ model }: ModelAnswerBlockProps) {
  const hasPrice =
    typeof model.inputPer1M === 'number' &&
    Number.isFinite(model.inputPer1M) &&
    typeof model.outputPer1M === 'number' &&
    Number.isFinite(model.outputPer1M);

  const deltaNote =
    hasPrice && typeof model.medianInputPer1M === 'number' && Number.isFinite(model.medianInputPer1M) && model.medianInputPer1M > 0
      ? model.inputPer1M < model.medianInputPer1M
        ? ` (${Math.round(((model.medianInputPer1M - model.inputPer1M) / model.medianInputPer1M) * 100)}% below the tracked catalog input median of ${fmtUsd(model.medianInputPer1M)}/1M)`
        : model.inputPer1M > model.medianInputPer1M
          ? ` (${Math.round(((model.inputPer1M - model.medianInputPer1M) / model.medianInputPer1M) * 100)}% above the tracked catalog input median of ${fmtUsd(model.medianInputPer1M)}/1M)`
          : ' (at the tracked catalog input median)'
      : '';

  const answerSummary = hasPrice
    ? `${model.name} (${model.provider}) costs ${fmtUsd(model.inputPer1M)} per 1M input tokens and ${fmtUsd(model.outputPer1M)} per 1M output tokens${deltaNote}, with a ${model.contextWindow ?? 'tracked'} context window and a PromptBill score of ${typeof model.score === 'number' && Number.isFinite(model.score) ? model.score.toFixed(1) : 'N/A'}${model.routerSummary ? `. ${model.routerSummary}` : ''}${model.lastVerified ? ` Verified ${model.lastVerified}.` : '.'}`
    : `${model.name} (${model.provider}) is tracked on PromptBill with a ${model.contextWindow ?? 'tracked'} context window and a composite score of ${typeof model.score === 'number' && Number.isFinite(model.score) ? model.score.toFixed(1) : 'N/A'}${model.lastVerified ? ` Verified ${model.lastVerified}.` : '.'}`;

  return (
    <section aria-label={`${model.name} summary`} className="space-y-4">
      <JsonLd data={buildModelSchema(model)} />
      <p className="text-sm leading-relaxed">
        <strong>Direct Answer:</strong> {answerSummary}
      </p>

      <h2>How much does {model.name} API cost per 1 million tokens?</h2>
      <p>
        {hasPrice
          ? `Official or tracked API pricing for ${model.name} is ${fmtUsd(model.inputPer1M)} per 1M input tokens and ${fmtUsd(model.outputPer1M)} per 1M output tokens (${model.pricingStatus ?? 'Tracked'}), with cached input reads at ${fmtUsd(model.cachedInputPer1M)} per 1M tokens.`
          : `Token pricing for ${model.name} is currently marked ${model.pricingStatus ?? 'pending verification'} on PromptBill.`}
      </p>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Provenance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Input (per 1M tokens)</td>
            <td>{fmtUsd(model.inputPer1M)}</td>
            <td>{model.pricingStatus ?? 'Tracked'}</td>
          </tr>
          <tr>
            <td>Output (per 1M tokens)</td>
            <td>{fmtUsd(model.outputPer1M)}</td>
            <td>{model.pricingStatus ?? 'Tracked'}</td>
          </tr>
          <tr>
            <td>Cached Input (per 1M tokens)</td>
            <td>{fmtUsd(model.cachedInputPer1M)}</td>
            <td>{model.pricingStatus ?? 'Tracked'}</td>
          </tr>
          <tr>
            <td>Context Window</td>
            <td>{model.contextWindow ?? 'N/A'}</td>
            <td>{model.benchmarkStatus ?? 'Tracked'}</td>
          </tr>
          <tr>
            <td>Throughput</td>
            <td>{typeof model.tokPerSec === 'number' && Number.isFinite(model.tokPerSec) ? `${model.tokPerSec} tok/s` : 'N/A'}</td>
            <td>Provider / Benchmark</td>
          </tr>
          <tr>
            <td>PromptBill Score</td>
            <td>{typeof model.score === 'number' && Number.isFinite(model.score) ? model.score.toFixed(1) : 'N/A'}</td>
            <td>{model.benchmarkStatus ?? 'Tracked'}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}

interface CompareAnswerBlockProps {
  modelA: SchemaModelInput;
  modelB: SchemaModelInput;
  lastVerified?: string | null;
}

export function CompareAnswerBlock({ modelA, modelB, lastVerified }: CompareAnswerBlockProps) {
  const aIn = typeof modelA.inputPer1M === 'number' && Number.isFinite(modelA.inputPer1M) ? modelA.inputPer1M : null;
  const bIn = typeof modelB.inputPer1M === 'number' && Number.isFinite(modelB.inputPer1M) ? modelB.inputPer1M : null;

  const cheaperInput =
    aIn !== null && bIn !== null
      ? aIn < bIn
        ? `${modelA.name} has lower input token pricing (${fmtUsd(aIn)} vs. ${fmtUsd(bIn)} per 1M)`
        : bIn < aIn
          ? `${modelB.name} has lower input token pricing (${fmtUsd(bIn)} vs. ${fmtUsd(aIn)} per 1M)`
          : `Both models share identical input token pricing at ${fmtUsd(aIn)} per 1M`
      : `Compare live input/output rates per 1M tokens across ${modelA.name} and ${modelB.name} below`;

  return (
    <section aria-label={`${modelA.name} vs ${modelB.name} summary`} className="space-y-4">
      <JsonLd data={buildCompareSchema(modelA, modelB)} />
      <p className="text-sm leading-relaxed">
        <strong>Direct Answer:</strong> {cheaperInput}. {modelA.name} ({modelA.provider}) lists {fmtUsd(modelA.inputPer1M)}/{fmtUsd(modelA.outputPer1M)} per 1M input/output tokens and a {modelA.contextWindow ?? 'tracked'} context window, while {modelB.name} ({modelB.provider}) lists {fmtUsd(modelB.inputPer1M)}/{fmtUsd(modelB.outputPer1M)} per 1M input/output tokens and a {modelB.contextWindow ?? 'tracked'} context window{lastVerified ? ` (verified ${lastVerified})` : ''}.
      </p>

      <h2>{modelA.name} vs {modelB.name}: Which is more cost-effective per 1M tokens?</h2>
      <table>
        <thead>
          <tr>
            <th>Dimension</th>
            <th>{modelA.name}</th>
            <th>{modelB.name}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Provider</td>
            <td>{modelA.provider}</td>
            <td>{modelB.provider}</td>
          </tr>
          <tr>
            <td>Input / 1M Tokens</td>
            <td>{fmtUsd(modelA.inputPer1M)}</td>
            <td>{fmtUsd(modelB.inputPer1M)}</td>
          </tr>
          <tr>
            <td>Output / 1M Tokens</td>
            <td>{fmtUsd(modelA.outputPer1M)}</td>
            <td>{fmtUsd(modelB.outputPer1M)}</td>
          </tr>
          <tr>
            <td>Cached Input / 1M Tokens</td>
            <td>{fmtUsd(modelA.cachedInputPer1M)}</td>
            <td>{fmtUsd(modelB.cachedInputPer1M)}</td>
          </tr>
          <tr>
            <td>Context Window</td>
            <td>{modelA.contextWindow ?? 'N/A'}</td>
            <td>{modelB.contextWindow ?? 'N/A'}</td>
          </tr>
          <tr>
            <td>Composite Score</td>
            <td>{typeof modelA.score === 'number' && Number.isFinite(modelA.score) ? modelA.score.toFixed(1) : 'N/A'}</td>
            <td>{typeof modelB.score === 'number' && Number.isFinite(modelB.score) ? modelB.score.toFixed(1) : 'N/A'}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
