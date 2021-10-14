import java.net.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;
import java.util.stream.*;

import javax.servlet.http.*;
import javax.ws.rs.*;
import javax.ws.rs.container.*;
import javax.ws.rs.core.*;

import com.orchestranetworks.rest.annotation.*;
import com.orchestranetworks.rest.inject.*;

/**
 * The REST Toolkit Track service v1.
 */
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Path("/track/v1")
@Documentation("Track service")
public final class TrackService
{
	@Context
	private ResourceInfo resourceInfo;

	@Context
	private SessionContext sessionContext;

	private static final Map<Integer, TrackDTO> TRACKS = new ConcurrentHashMap<>();

	/**
	 * Gets service description
	 */
	@GET
	@Path("/description")
	@Documentation("Gets service description")
	@Produces({ MediaType.TEXT_PLAIN, MediaType.APPLICATION_JSON })
	@AnonymousAccessEnabled
	public String handleServiceDescription()
	{
		return this.resourceInfo.getResourceMethod().getAnnotation(Documentation.class).value();
	}

	/**
	 * Selects tracks.
	 */
	@GET
	@Path("/tracks")
	@Documentation("Selects tracks")
	public Collection<TrackDTO> handleSelectTracks(
			@QueryParam("singerFilter") final String singerFilter, // a URL parameter holding a Java regular expression
			@QueryParam("titleFilter") final String titleFilter) // a URL parameter holding a Java regular expression
	{
		final Pattern singerPattern = TrackService.compilePattern(singerFilter);
		final Pattern titlePattern = TrackService.compilePattern(titleFilter);

		return TRACKS.values()
				.parallelStream()
				.filter(Objects::nonNull)
				.filter(track -&gt; singerPattern == null || singerPattern.matcher(track.singer).matches())
				.filter(track -&gt; titlePattern == null || titlePattern.matcher(track.title).matches())
				.collect(Collectors.toList());
	}

	private static Pattern compilePattern(final String aPattern)
	{
		if (aPattern == null || aPattern.isEmpty())
			return null;

		try
		{
			return Pattern.compile(aPattern);
		}
		catch (final PatternSyntaxException ignore)
		{
			// ignore invalid pattern
			return null;
		}
	}

	/**
	 * Counts all tracks.
	 */
	@GET
	@Path("/tracks:count")
	@Documentation("Counts all tracks")
	public int handleCountTracks()
	{
		return TRACKS.size();
	}

	/**
	 * Selects a track by id.
	 */
	@GET
	@Path("/tracks/{id}")
	@Documentation("Selects a track by id")
	public TrackDTO handleSelectTrackById(@PathParam("id") Integer id)
	{
		final TrackDTO track = TRACKS.get(id);
		if (track == null)
			throw new NotFoundException("Track id [" + id + "] does not found.");
		return track;
	}

	/**
	 * Deletes a track by id.
	 */
	@DELETE
	@Path("/tracks/{id}")
	@Documentation("Deletes a track by id")
	public void handleDeleteTrackById(@PathParam("id") Integer id)
	{
		if (!TRACKS.containsKey(id))
			throw new NotFoundException("Track id [" + id + "] does not found.");
		TRACKS.remove(id);
	}

	/**
	 * Inserts or updates one or several tracks.
	 * <p>
	 * The complex response structure corresponds to one of:
	 * <ul>
	 *  <li>An empty content with the <code>location<code> HTTP header defined
	 *   to the access URI.</li>
	 *  <li>A JSON array of {@link ResultDetailsDTO} objects.</li>
	 * </ul>
	 */
	@POST
	@Path("/tracks")
	@Documentation("Inserts or updates one or several tracks")
	public Response handleInsertOrUpdateTracks(List<TrackDTO> tracks)
	{
		int inserted = 0;
		int updated = 0;

		final ResultDetailsDTO[] resultDetails = new ResultDetailsDTO[tracks.size()];
		int resultIndex = 0;

		final URI base = this.sessionContext.getURIInfoUtility()
				.createBuilderForRESTApplication()
				.path(this.getClass())
				.segment("tracks")
				.build();

		for (final TrackDTO track : tracks)
		{
			final String id = String.valueOf(track.id);
			final URI uri = UriBuilder.fromUri(base).segment(id).build();

			final int code;
			if (TRACKS.containsKey(track.id))
			{
				code = HttpServletResponse.SC_NO_CONTENT;
				updated++;
			}
			else
			{
				code = HttpServletResponse.SC_CREATED;
				inserted++;
			}

			TRACKS.put(track.id, track);

			resultDetails[resultIndex++] = ResultDetailsDTO.create(
				code,
				null,
				String.valueOf(track.id),
				uri);
		}

		if (inserted == 1 &amp;&amp; updated == 0)
			return Response.created(resultDetails[0].details).build();

		return Response.ok().entity(resultDetails).build();
	}

	/**
	 * Updates one track.
	 */
	@PUT
	@Path("/tracks/{id}")
	@Documentation("Update one track")
	public void handleUpdateOneTrack(@PathParam("id") Integer id, TrackDTO aTrack)
	{
		final TrackDTO track = TRACKS.get(id);
		if (track == null)
			throw new NotFoundException("Track id [" + id + "] does not found.");

		if (aTrack.id != null &amp;&amp; !aTrack.id.equals(track.id))
			throw new BadRequestException("Selected track id [" + id
				+ "] is not equals to body track id.");

		TRACKS.put(aTrack.id, aTrack);
	}
}