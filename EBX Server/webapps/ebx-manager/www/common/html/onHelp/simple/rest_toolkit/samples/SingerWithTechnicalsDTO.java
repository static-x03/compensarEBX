/**
 * DTO for a singer with technical fields.
 */
public final class SingerWithTechnicalsDTO
{
	@Table(
		dataModel = "urn:ebx:module:tracks-module:/WEB-INF/ebx/schemas/tracks.xsd",
		tablePath = "/root/Singers")
	@ExtendedOutput({Include.LABEL,Include.TECHNICALS,Include.CONTENT})
	public ContentHolder content;
}