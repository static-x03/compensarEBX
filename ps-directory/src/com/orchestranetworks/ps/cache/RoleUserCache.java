package com.orchestranetworks.ps.cache;

import com.orchestranetworks.service.*;

public class RoleUserCache extends CachedObject
{
	private final UserReference user;
	private final boolean member;

	public RoleUserCache(long expiration, UserReference user, boolean member)
	{
		super(expiration, false);
		this.user = user;
		this.member = member;
	}

	public UserReference getUser()
	{
		return user;
	}

	public boolean isMember()
	{
		return member;
	}
}