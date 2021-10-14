/**
 * DTO for a singer.
 */
public final class SingerDTO
{
	@Table(
		dataModel = "urn:ebx:module:tracks-module:/WEB-INF/ebx/schemas/tracks.xsd",
		tablePath = "/root/Singers")
	public ContentHolder content;
}