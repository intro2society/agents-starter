export type ServiceBindingFetcher = {
  fetch(request: Request): Promise<Response>;
};

export type ProbateStateCourt = {
  state: string;
  code: string;
  officialCourt: string;
};

export type ProbateDirectoryStatus = {
  states: number;
  officialCourtStartingPoints: number;
  manualResearch: boolean;
  automaticCaseHarvesting: boolean;
};

export async function fetchProbateDirectory(
  hub: ServiceBindingFetcher | undefined,
  requestedState?: string
): Promise<string> {
  if (!hub) {
    return "The internal probate research directory is not configured.";
  }

  try {
    const [statusResponse, statesResponse] = await Promise.all([
      hub.fetch(
        new Request("https://scraper.theintro2society.org/api/status")
      ),
      hub.fetch(
        new Request("https://scraper.theintro2society.org/api/states")
      )
    ]);

    if (!statusResponse.ok || !statesResponse.ok) {
      const status = !statusResponse.ok
        ? statusResponse.status
        : statesResponse.status;
      return `The probate research directory is temporarily unavailable (HTTP ${status}).`;
    }

    const [status, states] = await Promise.all([
      statusResponse.json() as Promise<ProbateDirectoryStatus>,
      statesResponse.json() as Promise<ProbateStateCourt[]>
    ]);

    const query = requestedState?.trim().toLowerCase();
    const matches = query
      ? states.filter(
          (entry) =>
            entry.code.toLowerCase() === query ||
            entry.state.toLowerCase() === query
        )
      : states;

    if (query && matches.length === 0) {
      return "No state matched that name or two-letter code. Use a full state name or its postal abbreviation.";
    }

    return JSON.stringify({
      status,
      states: matches,
      note: status.automaticCaseHarvesting
        ? "Automated case harvesting is reported as enabled."
        : "This is a 50-state directory of official court starting points for researcher-assisted work; it does not automatically harvest court case records."
    });
  } catch {
    return "The probate research directory could not be reached through the internal service hub.";
  }
}
