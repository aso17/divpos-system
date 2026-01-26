<?php

namespace App\Http\Controllers;

use App\Models\Ms_user;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    // GET /user
   public function index(Request $request)
{
    // ⛔ WAJIB tenant_id
    if (!$request->filled('tenant_id')) {
        return response()->json([
            'message' => 'tenant_id is required'
        ], 422);
    }

    $query = Ms_user::select(
        'id',
        'full_name',
        'email',
        'username',
        'phone',
        'is_active',
        'role_id',
        'tenant_id',
        'created_at'
    )->with([
        'role:id,role_name,code',
        'tenant:id,slug,code'
    ])
    ->where('tenant_id', $request->tenant_id); // 🔒 kunci tenant di awal

    // 🔎 Filter keyword
    if ($request->filled('keyword')) {
        $q = $request->keyword;
        $query->where(function($w) use ($q) {
            $w->where('full_name','like',"%$q%")
              ->orWhere('email','like',"%$q%")
              ->orWhere('username','like',"%$q%");
        });
    }

    if ($request->filled('role_id')) {
        $query->where('role_id', $request->role_id);
    }

    // 📄 Pagination support
    if ($request->filled('page')) {
        return response()->json(
            $query->orderBy('id','desc')
                  ->paginate($request->per_page ?? 10)
        );
    }

    return response()->json(
        $query->orderBy('id','desc')->get()
    );
}


    // GET /user/{id}
    public function show($id)
    {
        return Ms_user::with([
            'role:id,role_name,code',
            'tenant:id,slug,code'
        ])->findOrFail($id);
    }

    // POST /user
  public function store(Request $request)
    {
        
       $request->validate([
        'full_name' => 'required|string|max:100',
        'email'     => 'required|email|unique:Ms_users,email',
        'username'  => 'nullable|string|max:50|unique:Ms_users,username',
        'phone'     => 'nullable|string|max:20',
        'password'  => 'required|min:8',
        'role_id'   => 'required|exists:Ms_roles,id',
        'tenant_id' => 'required|exists:Ms_tenants,id',
        'is_active' => 'nullable|boolean',
        'avatar'    => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);


        $data = $request->only([
            'full_name',
            'email',
            'username',
            'phone',
            'role_id',
            'tenant_id',
            'is_active'
        ]);

        // Default aktif jika tidak dikirim
        $data['is_active'] = $data['is_active'] ?? true;

        // Hash password
        $data['password'] = Hash::make($request->password);

        // Upload avatar (nama unik)
        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = 'avatar_' . time() . '_' . Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');
            $data['avatar'] = $path;
        }

        $user = Ms_user::create($data);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dibuat',
            'data'    => $user,
        ], 201);
    }

    // PUT /user/{id}
    public function update(Request $r, $id)
    {
        $user = Ms_user::findOrFail($id);

        $r->validate([
            'full_name' => 'required|string|max:100',
            'email'     => "required|email|unique:Ms_users,email,$id",
            'username'  => "nullable|unique:Ms_users,username,$id",
            'role_id'   => 'nullable|exists:Ms_roles,id',
            'tenant_id' => 'nullable|exists:Ms_tenants,id',
        ]);

        $user->update($r->only([
            'full_name','email','username','phone','role_id','tenant_id','is_active'
        ]));

        if ($r->filled('password')) {
            $user->update(['password' => Hash::make($r->password)]);
        }

        return response()->json($user);
    }

    // DELETE /user/{id}
    public function destroy($id)
    {
        Ms_user::destroy($id);
        return response()->json(['message' => 'User deleted']);
    }
}
