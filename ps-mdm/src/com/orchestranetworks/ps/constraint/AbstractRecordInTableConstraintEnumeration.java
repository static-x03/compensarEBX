package com.orchestranetworks.ps.constraint;

import java.text.*;
import java.util.*;

import org.apache.commons.lang3.*;

import com.onwbp.adaptation.*;
import com.orchestranetworks.instance.*;
import com.orchestranetworks.schema.*;
import com.orchestranetworks.service.*;

public abstract class AbstractRecordInTableConstraintEnumeration
	implements ConstraintEnumeration<String>
{

	public static final String MESSAGE = "{0} should specify a record in the {1} Table";
	public static final String GMESSAGE = "{0} should specify a record in the referenced table";

	@Override
	public void checkOccurrence(String value, ValueContextForValidation context)
		throws InvalidSchemaException
	{
		getRecord(value, context);
	}

	public Adaptation getDataSet(ValueContext context)
	{
		return context.getAdaptationTable().getContainerAdaptation();
	}

	protected AdaptationTable getTable(ValueContext context) throws OperationException
	{
		Path tablePath = getTablePath(context);
		Adaptation dataSet = getDataSet(context);
		try
		{
			return dataSet.getTable(tablePath);
		}
		catch (PathAccessException e)
		{
			return null;
		}
	}

	protected Adaptation getRecord(String value, ValueContextForValidation context)
	{
		try
		{
			AdaptationTable table = getTable(context);
			if (table == null)
			{
				context.addError("Failed to find table for record lookup");
				return null;
			}
			Adaptation record = table.lookupAdaptationByPrimaryKey(PrimaryKey.parseString(value));
			if (record == null)
			{
				context.addError(
					MessageFormat.format(
						MESSAGE,
						value,
						table.getTableNode().getLabel(Locale.getDefault())));
			}
			return record;
		}
		catch (OperationException e)
		{
			context.addError("Failed to Reference Table for record lookup");
			return null;
		}
	}

	protected abstract Path getTablePath(ValueContext context);

	@Override
	public String toUserDocumentation(Locale locale, ValueContext context)
		throws InvalidSchemaException
	{
		return MessageFormat.format(GMESSAGE, context.getNode().getLabel(locale));
	}

	@Override
	public String displayOccurrence(String value, ValueContext context, Locale locale)
		throws InvalidSchemaException
	{
		return getLabelForRecord(context, value, locale);
	}

	public String getLabelForRecord(ValueContext context, String recordKey, Locale locale)
	{
		if (StringUtils.isEmpty(recordKey))
			return null;
		try
		{
			AdaptationTable table = getTable(context);
			if (table != null)
			{
				Adaptation record = table
					.lookupAdaptationByPrimaryKey(PrimaryKey.parseString(recordKey));
				if (record == null)
					return recordKey;
				return record.getLabel(locale);
			}
			return recordKey;
		}
		catch (OperationException e)
		{
			return recordKey + "(! error computing label)";
		}
	}

	@Override
	public List<String> getValues(ValueContext context) throws InvalidSchemaException
	{
		try
		{
			List<String> keys = new ArrayList<>();
			AdaptationTable table = getTable(context);
			RequestResult allRows = table.createRequestResult(getPredicate(context));
			try
			{
				Adaptation next = allRows.nextAdaptation();
				while (next != null)
				{
					keys.add(next.getOccurrencePrimaryKey().format());
					next = allRows.nextAdaptation();
				}
			}
			finally
			{
				allRows.close();
			}
			return keys;
		}
		catch (Exception e)
		{
			LoggingCategory.getKernel().error("Error getting values for enumeration.", e);
			return Collections.emptyList();
		}
	}

	protected String getPredicate(ValueContext context)
	{
		return null;
	}

}
