package com.orchestranetworks.ps.admin.devartifacts.addon.adix;

import java.util.*;

import com.onwbp.adaptation.*;
import com.orchestranetworks.schema.*;

/**
 * A base filter used by many Data Exchange tables
 */
public class AddonAdixBaseAdaptationFilter implements AdaptationFilter
{
	private Collection<String> primaryKeys;
	private Path foreignKeyPath;
	private Path builtInFieldPath;

	AddonAdixBaseAdaptationFilter(
		Collection<String> primaryKeys,
		Path foreignKeyPath,
		Path builtInFieldPath)
	{
		this.primaryKeys = primaryKeys;
		this.foreignKeyPath = foreignKeyPath;
		this.builtInFieldPath = builtInFieldPath;
	}

	@Override
	public boolean accept(Adaptation adaptation)
	{
		// Don't include the record if it's a built-in record
		if (builtInFieldPath != null)
		{
			String builtInValue = adaptation.getString(builtInFieldPath);
			if (builtInValue != null
				&& builtInValue.startsWith(AddonAdixDevArtifactsUtil.BUILT_IN_FIELD_PREFIX))
			{
				return false;
			}
		}
		// Null indicates to not use a cache at all and only check the built-in field above
		if (primaryKeys == null)
		{
			return true;
		}
		if (primaryKeys.isEmpty())
		{
			return false;
		}
		String pk;
		if (foreignKeyPath == null)
		{
			pk = adaptation.getOccurrencePrimaryKey().format();
		}
		else
		{
			pk = adaptation.getString(foreignKeyPath);
			if (pk == null)
			{
				return false;
			}
		}
		return primaryKeys.contains(pk);
	}
}
