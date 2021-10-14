/**
 * The REST Toolkit Singer service v1.
 */
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Path("/singer/v1")
@Documentation("Singer service")
public final class SingerService
{
	...

	/**
	 * Selects a singer by id.
	 */
	@GET
	@Path("/singers/{id}")
	@Documentation("Selects a singer by id")
	public SingerDTO handleSelectSingerById(final @PathParam("id") Integer id)
	{
		// find the singer adaptation by id
		final Adaptation singerRecord = ... ; 
		
		final SingerDTO singerDTO = new SingerDTO();
		singerDTO.content = ContentHolderForOutput.createForRecord(singerRecord);
		return singerDTO;
	}


	/**
	 * Inserts one singer.
	 */
	@POST
	@Path("/singers")
	@Documentation("Inserts one singer")
	public void handleInsertOneSinger(final SingerDTO aSingerDTO)
	{
		final ProgrammaticService svc = ... ;
		final AdaptationTable singersTable = ... ;
		final ProcedureResult procedureResult = svc.execute(
				(aContext) -> {
					final ValueContextForUpdate createContext = aContext.getContextForNewOccurrence(singersTable); ;
					aSingerDTO.content.asContentHolderForInput().copyTo(createContext);
					aContext.doCreateOccurrence(createContext, singersTable);
				});

		if (procedureResult.hasFailed())
			throw new UnprocessableEntityException(
				procedureResult.getException().getLocalizedMessage());
	}
	
	/**
	 * updates one singer.
	 */
	@PUT
	@Path("/singers/{id}")
	@Documentation("updates one singer")
	public void handleUpdateOneSinger(@PathParam("id") final Integer id, final SingerDTO aSingerDTO)
	{
		final ProgrammaticService svc = ... ;
		final AdaptationTable singersTable = ... ;
		final ProcedureResult procedureResult = svc.execute(
				(aContext) -> {
					// find the singer adaptation by id
					final Adaptation singerRecord = ... ;

					if (singerRecord == null)
						throw new NotFoundException("Singer with the id ["+ id + "] has not been found.");

					final ValueContextForUpdate createContext = aContext.getContext(singerRecord.getAdaptationName()); ;
					aSingerDTO.content.asContentHolderForInput().copyTo(createContext);
					aContext.doModifyContent(singerRecord, createContext);
				});

		if (procedureResult.hasFailed()){
			final Exception ex = procedureResult.getException();
			final Throwable cause = ex.getCause();
			if(cause instanceof NotFoundException)
				throw (NotFoundException) cause;

			throw new UnprocessableEntityException(ex.getLocalizedMessage());
		}	
	}
}