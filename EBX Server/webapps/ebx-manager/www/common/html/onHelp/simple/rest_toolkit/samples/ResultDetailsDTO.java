import java.net.*;

/**
 * DTO for result details.
 */
@JsonbPropertyOrder({ "code", "label", "foreignKey", "details" })
public final class ResultDetailsDTO
{
	public int code;
	public String label;
	public String foreignKey;
	public URI details;

	public static ResultDetailsDTO create(
		final int aCode,
		final String aForeignKey,
		final URI aDetails)
	{
		return ResultDetailsDTO.create(aCode, null, aForeignKey, aDetails);
	}

	public static ResultDetailsDTO create(
		final int aCode,
		final String aLabel,
		final String aForeignKey,
		final URI aDetails)
	{
		final ResultDetailsDTO result = new ResultDetailsDTO();
		result.code = aCode;
		result.label = aLabel;
		result.foreignKey = aForeignKey;
		result.details = aDetails;
		return result;
	}
}
