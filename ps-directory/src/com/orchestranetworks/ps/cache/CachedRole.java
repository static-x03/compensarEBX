package com.orchestranetworks.ps.cache;

public class CachedRole extends CachedObject
{
	private final String role;
	private final String externalRole;

	public CachedRole(long expiration, boolean external, String role, String externalRole)
	{
		super(expiration, external);
		this.role = role;
		this.externalRole = externalRole;
	}

	public String getRole()
	{
		return role;
	}

	public String getExternalRole()
	{
		return externalRole;
	}
}