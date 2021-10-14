/**
 * DTO for a vynil.
 */
public final class VinylDTO
{
	@JsonbTypeSerializer(CustomTrackDtoSerializer.class)
	@JsonbTypeDeserializer(CustomTrackDtoDeserializer.class)
	public TrackDTO track;
}
